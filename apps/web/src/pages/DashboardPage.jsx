import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import TopSellingList from "../components/TopSellingList";
import { formatCurrencyDh } from "../utils/formatters";

const periodOptions = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

function DashboardPage() {
  const [period, setPeriod] = useState("day");
  const [report, setReport] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [reportResponse, alertsResponse] = await Promise.all([
          api.get("/reports", {
            params: { period },
          }),
          api.get("/stocks/alerts"),
        ]);

        if (isMounted) {
          setReport(reportResponse.data);
          setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Impossible de charger les donnees du dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [period]);

  const lowStockCount = alerts.length;
  const criticalStockCount = alerts.filter((alert) => alert.severity === "critical").length;
  const warningStockCount = lowStockCount - criticalStockCount;

  const stats = useMemo(
    () => [
      {
        label: "Revenu",
        value: isLoading
          ? "Chargement..."
          : formatCurrencyDh(report?.revenue || 0),
        detail: "Chiffre d'affaires de la periode selectionnee.",
        tone: "success",
      },
      {
        label: "Nombre de ventes",
        value: isLoading ? "Chargement..." : report?.salesCount || 0,
        detail: "Transactions enregistrees sur la periode.",
        tone: "info",
      },
      {
        label: "Panier moyen",
        value: isLoading
          ? "Chargement..."
          : formatCurrencyDh(report?.averageBasket || 0),
        detail: "Montant moyen par ticket.",
        tone: "default",
      },
      {
        label: "Meilleur magasin",
        value: isLoading ? "Chargement..." : report?.bestStore || "-",
        detail: "Point de vente le plus performant.",
        tone: "warning",
      },
      {
        label: "Alertes Stock",
        value: isLoading ? "Chargement..." : lowStockCount,
        detail:
          isLoading
            ? "Analyse des seuils en cours."
            : `${lowStockCount} produits en stock faible`,
        tone: criticalStockCount > 0 ? "danger" : "warning",
      },
    ],
    [criticalStockCount, isLoading, lowStockCount, report]
  );

  const topProducts = useMemo(
    () =>
      (report?.topProducts || []).map((product) => ({
        name: product.name || product.productName || "Produit",
        unitsSold: product.quantitySold || product.quantity || product.unitsSold || 0,
        store: product.store || report?.bestStore || "Reseau",
        revenue: product.revenue || 0,
      })),
    [report]
  );

  const salesByStore = report?.salesByStore || [];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Suivre la performance commerciale et les indicateurs cles du reseau en temps reel."
        actions={
          <>
            <div className="period-selector">
              {periodOptions.map((option) => (
                <button
                  key={option.key}
                  className={`period-button ${period === option.key ? "active" : ""}`}
                  type="button"
                  onClick={() => setPeriod(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setIsAlertsModalOpen(true)}
            >
              Voir alertes
            </button>
          </>
        }
      />

      {errorMessage ? (
        <div className="inline-notice error">{errorMessage}</div>
      ) : null}

      <div className="card-grid">
        {stats.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Top produits"
          description="Meilleures references sur la periode selectionnee."
        >
          {isLoading ? (
            <div className="empty-state">Chargement des top produits...</div>
          ) : (
            <TopSellingList products={topProducts} />
          )}
        </SectionCard>

        <SectionCard
          title="Ventes par magasin"
          description="Comparaison du chiffre d'affaires et du volume des ventes."
        >
          <DataTable
            columns={[
              { key: "store", label: "Magasin" },
              { key: "salesCount", label: "Nb ventes" },
              { key: "revenue", label: "Revenu" },
            ]}
            data={salesByStore}
            emptyTitle={isLoading ? "Chargement..." : "Aucune donnee disponible"}
            emptyDescription={
              isLoading
                ? "Recuperation du rapport en cours."
                : "Aucune synthese magasin disponible."
            }
            renderRow={(item, index) => (
              <tr key={`${item.store || item.storeName || "store"}-${index}`}>
                <td>{item.store || item.storeName || "-"}</td>
                <td>{item.salesCount || item.count || 0}</td>
                <td>{formatCurrencyDh(item.revenue || 0)}</td>
              </tr>
            )}
          />
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-secondary-grid">
        <SectionCard
          title="Vue operationnelle"
          description="Resume rapide de la periode active."
        >
          <div className="alert-list">
            <div className="alert-item">
              <div>
                <strong>Periode active</strong>
                <span>Analyse actuellement affichee sur {period}.</span>
              </div>
              <Badge tone="info">{period}</Badge>
            </div>

            <div className="alert-item">
              <div>
                <strong>Magasin leader</strong>
                <span>{report?.bestStore || "En attente de donnees"}</span>
              </div>
              <Badge tone="success">
                {isLoading ? "..." : formatCurrencyDh(report?.revenue || 0)}
              </Badge>
            </div>

            <div className="alert-item">
              <div>
                <strong>Panier moyen</strong>
                <span>Valeur moyenne observee sur la periode.</span>
              </div>
              <Badge tone="neutral">
                {isLoading ? "..." : formatCurrencyDh(report?.averageBasket || 0)}
              </Badge>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Synthese ventes"
          description="Volume global remonte par l'API de reporting."
        >
          <div className="alert-list">
            <div className="alert-item">
              <div>
                <strong>Transactions</strong>
                <span>Nombre total de ventes sur la periode.</span>
              </div>
              <Badge tone="info">
                {isLoading ? "..." : report?.salesCount || 0}
              </Badge>
            </div>

            <div className="alert-item">
              <div>
                <strong>Top produit</strong>
                <span>
                  {topProducts[0]?.name || "Aucun produit disponible pour le moment."}
                </span>
              </div>
              <Badge tone="warning">
                {isLoading ? "..." : topProducts[0]?.unitsSold || 0}
              </Badge>
            </div>

            <div className="alert-item">
              <div>
                <strong>Stock critique</strong>
                <span>Produits a zero necessitant un reapprovisionnement.</span>
              </div>
              <Badge tone={criticalStockCount > 0 ? "stock-critical" : "neutral"}>
                {isLoading ? "..." : criticalStockCount}
              </Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal
        isOpen={isAlertsModalOpen}
        eyebrow="Surveillance stock"
        title="Alertes de stock"
        description="Liste des produits dont la quantite est inferieure ou egale au seuil minimum."
        onClose={() => setIsAlertsModalOpen(false)}
        cardClassName="modal-large stock-alert-modal"
        headerClassName="stock-alert-modal-header"
        bodyClassName="stock-alert-modal-body"
        actionsClassName="stock-alert-modal-actions"
        actions={
          <button
            className="ghost-button"
            type="button"
            onClick={() => setIsAlertsModalOpen(false)}
          >
            Fermer
          </button>
        }
      >
        <div className="stock-alert-summary">
          <div className="stock-alert-summary-card critical">
            <span>Produits en rupture</span>
            <strong>{isLoading ? "..." : criticalStockCount}</strong>
          </div>
          <div className="stock-alert-summary-card warning">
            <span>Produits en stock faible</span>
            <strong>{isLoading ? "..." : warningStockCount}</strong>
          </div>
        </div>

        <div className="stock-alert-table-wrap">
          <DataTable
            columns={[
              { key: "product", label: "Produit" },
              { key: "store", label: "Magasin" },
              { key: "quantity", label: "Quantite" },
              { key: "minimumThreshold", label: "Seuil minimum" },
              { key: "status", label: "Statut" },
            ]}
            data={alerts}
            emptyTitle={isLoading ? "Chargement..." : "Aucune alerte active"}
            emptyDescription={
              isLoading
                ? "Recuperation des alertes en cours."
                : "Tous les produits sont au-dessus du seuil minimum."
            }
            renderRow={(item) => (
              <tr
                key={`${item.produitId}-${item.magasinId}`}
                className={
                  item.severity === "critical"
                    ? "stock-row-critical stock-alert-critical"
                    : "stock-row-warning"
                }
              >
                <td>{item.produitNom}</td>
                <td>{item.magasin}</td>
                <td>{item.quantite}</td>
                <td>{item.seuilMinimum}</td>
                <td>
                  <Badge
                    tone={
                      item.severity === "critical"
                        ? "stock-critical"
                        : "stock-warning"
                    }
                  >
                    {item.severity === "critical" ? "Stock critique" : "Stock faible"}
                  </Badge>
                </td>
              </tr>
            )}
          />
        </div>
      </Modal>
    </div>
  );
}

export default DashboardPage;
