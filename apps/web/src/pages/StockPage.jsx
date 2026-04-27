import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import SectionCard from "../components/SectionCard";
import { getCurrentUser } from "../store/authStore";

const createInitialModalState = () => ({
  isOpen: false,
  mode: "entry",
  stock: null,
});

const createInitialFormData = (mode = "entry", stock = null) => ({
  quantity:
    mode === "correction"
      ? String(stock?.quantity ?? "")
      : "",
  reason: mode === "correction" ? "Correction inventaire" : "Réapprovisionnement",
});

function StockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("Tous");
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [modalError, setModalError] = useState("");
  const [stockModal, setStockModal] = useState(createInitialModalState);
  const [formData, setFormData] = useState(createInitialFormData());
  const currentUser = getCurrentUser();
  const canManageStock = currentUser?.role === "admin";

  const fetchStocks = async () => {
    const response = await api.get("/stocks");
    setStocks(Array.isArray(response.data) ? response.data : response.data?.data || []);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStocks() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await api.get("/stocks");

        if (isMounted) {
          setStocks(
            Array.isArray(response.data) ? response.data : response.data?.data || []
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Impossible de charger le stock pour le moment."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStocks();

    return () => {
      isMounted = false;
    };
  }, []);

  const storeOptions = useMemo(
    () => [...new Set(stocks.map((item) => item.storeName).filter(Boolean))],
    [stocks]
  );

  const filteredStocks = useMemo(
    () =>
      stocks.filter((item) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          item.productName?.toLowerCase().includes(query) ||
          item.barcode?.toLowerCase().includes(query);
        const matchesStore =
          selectedStore === "Tous" || item.storeName === selectedStore;

        return matchesSearch && matchesStore;
      }),
    [stocks, searchTerm, selectedStore]
  );

  const openStockModal = (mode, stock) => {
    setNotice({ type: "", message: "" });
    setModalError("");
    setStockModal({
      isOpen: true,
      mode,
      stock,
    });
    setFormData(createInitialFormData(mode, stock));
  };

  const closeStockModal = () => {
    if (isSubmitting) {
      return;
    }

    setStockModal(createInitialModalState());
    setFormData(createInitialFormData());
    setModalError("");
  };

  const resetStockModal = () => {
    setStockModal(createInitialModalState());
    setFormData(createInitialFormData());
    setModalError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setModalError("");
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const quantity = Number(formData.quantity);

    if (formData.quantity === "") {
      return stockModal.mode === "entry"
        ? "La quantité à ajouter est obligatoire."
        : "La nouvelle quantité est obligatoire.";
    }

    if (
      stockModal.mode === "entry" &&
      (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity))
    ) {
      return "La quantité à ajouter doit être un entier supérieur à 0.";
    }

    if (
      stockModal.mode === "correction" &&
      (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity))
    ) {
      return "La nouvelle quantité doit être un entier supérieur ou égal à 0.";
    }

    if (!formData.reason.trim()) {
      return "Le motif / raison est obligatoire.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setModalError(validationMessage);
      return;
    }

    if (!stockModal.stock) {
      setModalError("Ligne de stock introuvable.");
      return;
    }

    const payload = {
      productId: stockModal.stock.productId,
      storeId: stockModal.stock.storeId,
      quantity: Number(formData.quantity),
      reason: formData.reason.trim(),
    };

    const endpoint =
      stockModal.mode === "entry" ? "/stocks/in" : "/stocks/correction";

    try {
      setIsSubmitting(true);
      setModalError("");

      await api.post(endpoint, payload);
      await fetchStocks();
      resetStockModal();
      setNotice({
        type: "success",
        message:
          stockModal.mode === "entry"
            ? "Entrée de stock enregistrée avec succès."
            : "Correction de stock enregistrée avec succès.",
      });
    } catch (error) {
      setModalError(
        error.response?.data?.message ||
          (stockModal.mode === "entry"
            ? "Impossible d'enregistrer l'entrée de stock."
            : "Impossible d'enregistrer la correction de stock.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle =
    stockModal.mode === "entry" ? "Entrée de stock" : "Correction de stock";
  const modalDescription =
    stockModal.mode === "entry"
      ? "Ajoutez une quantité au stock existant du produit sélectionné."
      : "Définissez la nouvelle quantité réelle pour corriger le stock du produit.";
  const quantityLabel =
    stockModal.mode === "entry" ? "Quantité à ajouter" : "Nouvelle quantité";
  const quantityPlaceholder =
    stockModal.mode === "entry"
      ? "Entrer la quantité à ajouter"
      : "Entrer la nouvelle quantité";
  const submitLabel = isSubmitting ? "Enregistrement..." : "Enregistrer";

  return (
    <div>
      <PageHeader
        eyebrow="Stock"
        title="Gestion du stock"
        description="Rechercher les niveaux de stock par magasin et identifier rapidement les seuils critiques."
      />

      {notice.message ? (
        <div className={`inline-notice ${notice.type}`}>{notice.message}</div>
      ) : null}

      <SectionCard
        title="Etat du stock"
        description="Suivi des quantites, seuils minimums et actions de correction."
      >
        <div className="filter-row">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par produit ou code-barres"
          />

          <select
            className="text-input select-input"
            value={selectedStore}
            onChange={(event) => setSelectedStore(event.target.value)}
          >
            <option value="Tous">Tous les magasins</option>
            {storeOptions.map((storeName) => (
              <option key={storeName} value={storeName}>
                {storeName}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? (
          <div className="inline-notice error">{errorMessage}</div>
        ) : null}

        <DataTable
          columns={[
            { key: "product", label: "Produit" },
            { key: "barcode", label: "Code-barres" },
            { key: "store", label: "Magasin" },
            { key: "quantity", label: "Quantite" },
            { key: "minimum", label: "Seuil mini" },
            { key: "status", label: "Statut" },
            { key: "actions", label: "Actions" },
          ]}
          data={filteredStocks}
          emptyTitle={isLoading ? "Chargement du stock..." : "Aucun mouvement trouve"}
          emptyDescription={
            isLoading
              ? "Veuillez patienter pendant la recuperation des donnees."
              : "Essayez un autre magasin ou une autre recherche."
          }
          renderRow={(item) => {
            const isCritical = item.severity === "critical";
            const isLow = item.isLowStock;
            const stockStatus = item.status || (isCritical
              ? "Rupture"
              : isLow
              ? "Stock faible"
              : "Disponible");
            const rowClassName = isCritical
              ? "stock-row-critical"
              : isLow
              ? "stock-row-warning"
              : "";

            return (
              <tr key={item.id} className={rowClassName}>
                <td>
                  <strong>{item.productName}</strong>
                </td>
                <td>{item.barcode}</td>
                <td>{item.storeName}</td>
                <td>{item.quantity}</td>
                <td>{item.minimumThreshold}</td>
                <td>
                  <Badge
                    tone={
                      isCritical
                        ? "stock-critical"
                        : isLow
                        ? "stock-warning"
                        : "success"
                    }
                  >
                    {stockStatus}
                  </Badge>
                </td>
                <td>
                  {canManageStock ? (
                    <div className="table-action-row">
                      <button
                        className="table-action-button"
                        type="button"
                        onClick={() => openStockModal("entry", item)}
                      >
                        Entree stock
                      </button>
                      <button
                        className="table-action-button"
                        type="button"
                        onClick={() => openStockModal("correction", item)}
                      >
                        Correction stock
                      </button>
                    </div>
                  ) : (
                    <span className="muted-text">-</span>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </SectionCard>

      <Modal
        isOpen={stockModal.isOpen}
        eyebrow="Mouvement de stock"
        title={modalTitle}
        description={modalDescription}
        onClose={closeStockModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeStockModal}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              className="primary-button"
              type="submit"
              form="stock-movement-form"
              disabled={isSubmitting}
            >
              {submitLabel}
            </button>
          </>
        }
      >
        {stockModal.stock ? (
          <div className="details-list">
            <div className="detail-stat">
              <span>Produit</span>
              <strong>{stockModal.stock.productName}</strong>
            </div>
            <div className="detail-stat">
              <span>Code-barres</span>
              <strong>{stockModal.stock.barcode}</strong>
            </div>
            <div className="detail-stat">
              <span>Magasin</span>
              <strong>{stockModal.stock.storeName}</strong>
            </div>
            <div className="detail-stat">
              <span>Quantité actuelle</span>
              <strong>{stockModal.stock.quantity}</strong>
            </div>
          </div>
        ) : null}

        <form className="form-grid" id="stock-movement-form" onSubmit={handleSubmit}>
          {modalError ? (
            <div className="inline-notice error">{modalError}</div>
          ) : null}

          <div className="field-group">
            <label className="field-label" htmlFor="stock-quantity">
              {quantityLabel}
            </label>
            <input
              id="stock-quantity"
              className="text-input"
              type="number"
              min={stockModal.mode === "entry" ? "1" : "0"}
              step="1"
              name="quantity"
              placeholder={quantityPlaceholder}
              value={formData.quantity}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="stock-reason">
              Motif / Raison
            </label>
            <input
              id="stock-reason"
              className="text-input"
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StockPage;
