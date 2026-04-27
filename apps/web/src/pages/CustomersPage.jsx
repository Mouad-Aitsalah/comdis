import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import { formatCurrencyDh, formatDateTime } from "../utils/formatters";

const getCollection = (payload, keys = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
};

const getCustomerCreditMeta = (credit) =>
  Number(credit) > 0
    ? {
        label: `Credit manquant: ${formatCurrencyDh(credit)}`,
        tone: "stock-warning",
      }
    : {
        label: "Aucun credit",
        tone: "success",
      };

const getSaleStatusMeta = (status) => {
  if (status === "cancelled") {
    return {
      label: "Annulee",
      tone: "danger",
    };
  }

  if (status === "refunded") {
    return {
      label: "Remboursee",
      tone: "warning",
    };
  }

  return {
    label: "Completee",
    tone: "success",
  };
};

function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerSales, setSelectedCustomerSales] = useState([]);
  const [payCreditModal, setPayCreditModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [creditPaymentAmount, setCreditPaymentAmount] = useState("");
  const [creditPaymentNote, setCreditPaymentNote] = useState("Paiement credit");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmittingCreditPayment, setIsSubmittingCreditPayment] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [creditPaymentError, setCreditPaymentError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });

  const fetchCustomers = async () => {
    const response = await api.get("/customers");
    const list = getCollection(response.data, ["data", "customers"]);
    setCustomers(list);
    return list;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await api.get("/customers");
        const list = getCollection(response.data, ["data", "customers"]);

        if (isMounted) {
          setCustomers(list);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Impossible de charger les clients pour le moment."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
          return true;
        }

        return (
          String(customer.customerNumber || "").includes(query) ||
          String(customer.name || "")
            .toLowerCase()
            .includes(query)
        );
      }),
    [customers, searchTerm]
  );

  const openCustomerDetails = async (customer) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError("");

      const [customerResponse, salesResponse] = await Promise.all([
        api.get(`/customers/${customer.id}`),
        api.get(`/customers/${customer.id}/sales`),
      ]);

      setSelectedCustomer(customerResponse.data?.data || customerResponse.data);
      setSelectedCustomerSales(getCollection(salesResponse.data, ["data", "sales"]));
    } catch (error) {
      setDetailsError(
        error.response?.data?.message ||
          "Impossible de charger les details du client."
      );
      setSelectedCustomer(customer);
      setSelectedCustomerSales([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setSelectedCustomerSales([]);
    setDetailsError("");
  };

  const openPayCreditModal = (customer) => {
    setNotice({ type: "", message: "" });
    setCreditPaymentError("");
    setCreditPaymentAmount("");
    setCreditPaymentNote("Paiement credit");
    setPayCreditModal({
      isOpen: true,
      customer,
    });
  };

  const closePayCreditModal = () => {
    if (isSubmittingCreditPayment) {
      return;
    }

    setPayCreditModal({
      isOpen: false,
      customer: null,
    });
    setCreditPaymentAmount("");
    setCreditPaymentNote("Paiement credit");
    setCreditPaymentError("");
  };

  const openDeleteModal = (customer) => {
    setNotice({ type: "", message: "" });
    setDeleteError(
      customer.customerNumber === 1
        ? "Le client inconnu ne peut pas etre supprime."
        : ""
    );
    setDeleteModal({
      isOpen: true,
      customer,
    });
  };

  const closeDeleteModal = () => {
    if (isDeletingCustomer) {
      return;
    }

    setDeleteModal({
      isOpen: false,
      customer: null,
    });
    setDeleteError("");
  };

  const handleSubmitCreditPayment = async (event) => {
    event.preventDefault();

    if (!payCreditModal.customer?.id) {
      setCreditPaymentError("Client introuvable.");
      return;
    }

    const amount = Number(creditPaymentAmount);

    if (!creditPaymentAmount || !Number.isFinite(amount)) {
      setCreditPaymentError("Le montant paye est obligatoire.");
      return;
    }

    if (amount <= 0) {
      setCreditPaymentError("Le montant paye doit etre superieur a 0.");
      return;
    }

    if (amount > Number(payCreditModal.customer.credit || 0)) {
      setCreditPaymentError("Le montant paye ne peut pas depasser le credit client.");
      return;
    }

    try {
      setIsSubmittingCreditPayment(true);
      setCreditPaymentError("");

      await api.post(`/customers/${payCreditModal.customer.id}/pay-credit`, {
        amount,
        note: creditPaymentNote.trim() || "Paiement credit",
      });

      await fetchCustomers();
      closePayCreditModal();
      closeCustomerDetails();
      setNotice({
        type: "success",
        message: "Credit client mis a jour avec succes.",
      });
    } catch (error) {
      setCreditPaymentError(
        error.response?.data?.message ||
          "Impossible de mettre a jour le credit client."
      );
    } finally {
      setIsSubmittingCreditPayment(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteModal.customer?.id) {
      setDeleteError("Client introuvable.");
      return;
    }

    if (deleteModal.customer.customerNumber === 1) {
      setDeleteError("Le client inconnu ne peut pas etre supprime.");
      return;
    }

    try {
      setIsDeletingCustomer(true);
      setDeleteError("");

      const response = await api.delete(`/customers/${deleteModal.customer.id}`);
      await fetchCustomers();
      closeDeleteModal();
      closeCustomerDetails();
      setNotice({
        type: "success",
        message:
          response.data?.message || "Client supprime avec succes.",
      });
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          "Impossible de supprimer ce client pour le moment."
      );
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title="Gestion des clients"
        description="Consulter les profils clients, les credits en cours et l'historique de leurs achats."
      />

      {notice.message ? (
        <div className={`inline-notice ${notice.type}`}>{notice.message}</div>
      ) : null}

      <SectionCard
        title="Liste des clients"
        description="Recherche par nom ou numero client."
      >
        <div className="table-toolbar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un client par nom ou numero"
          />
        </div>

        {errorMessage ? (
          <div className="inline-notice error">{errorMessage}</div>
        ) : null}

        <DataTable
          columns={[
            { key: "customerNumber", label: "Numero client" },
            { key: "name", label: "Nom" },
            { key: "phone", label: "Telephone" },
            { key: "email", label: "Email" },
            { key: "credit", label: "Credit" },
            { key: "totalPurchases", label: "Total achats" },
            { key: "salesCount", label: "Nb achats" },
            { key: "actions", label: "Actions" },
          ]}
          data={filteredCustomers}
          emptyTitle={isLoading ? "Chargement..." : "Aucun client trouve"}
          emptyDescription={
            isLoading
              ? "Recuperation des clients en cours."
              : "Ajustez la recherche pour voir les clients."
          }
          renderRow={(customer) => {
            const creditMeta = getCustomerCreditMeta(customer.credit || 0);

            return (
              <tr key={customer.id}>
                <td>
                  <strong>#{customer.customerNumber}</strong>
                </td>
                <td>{customer.name}</td>
                <td>{customer.phone || "-"}</td>
                <td>{customer.email || "-"}</td>
                <td>
                  <Badge tone={creditMeta.tone}>{creditMeta.label}</Badge>
                </td>
                <td>{formatCurrencyDh(customer.totalPurchases || 0)}</td>
                <td>{customer.salesCount || 0}</td>
                <td>
                  <div className="table-action-row">
                    <button
                      className="table-action-button"
                      type="button"
                      onClick={() => openCustomerDetails(customer)}
                    >
                      Voir details
                    </button>
                    <button
                      className="table-action-button"
                      type="button"
                      onClick={() => openPayCreditModal(customer)}
                      disabled={Number(customer.credit || 0) <= 0}
                      title={
                        Number(customer.credit || 0) <= 0
                          ? "Aucun credit a payer"
                          : ""
                      }
                    >
                      {Number(customer.credit || 0) <= 0
                        ? "Aucun credit a payer"
                        : "Payer credit"}
                    </button>
                    <button
                      className="table-action-button danger"
                      type="button"
                      onClick={() => openDeleteModal(customer)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </SectionCard>

      <Modal
        isOpen={Boolean(selectedCustomer)}
        eyebrow="Profil client"
        title={
          selectedCustomer
            ? `Client #${selectedCustomer.customerNumber} - ${selectedCustomer.name}`
            : ""
        }
        description="Consultez les informations du client et l'historique de ses achats."
        onClose={closeCustomerDetails}
        actions={
          <button className="ghost-button" type="button" onClick={closeCustomerDetails}>
            Fermer
          </button>
        }
      >
        {detailsError ? (
          <div className="inline-notice error">{detailsError}</div>
        ) : null}

        {selectedCustomer ? (
          <>
            <div className="details-list">
              <div className="detail-stat">
                <span>Numero client</span>
                <strong>#{selectedCustomer.customerNumber}</strong>
              </div>
              <div className="detail-stat">
                <span>Nom</span>
                <strong>{selectedCustomer.name}</strong>
              </div>
              <div className="detail-stat">
                <span>Telephone</span>
                <strong>{selectedCustomer.phone || "-"}</strong>
              </div>
              <div className="detail-stat">
                <span>Email</span>
                <strong>{selectedCustomer.email || "-"}</strong>
              </div>
              <div className="detail-stat">
                <span>Credit actuel</span>
                <strong>{formatCurrencyDh(selectedCustomer.credit || 0)}</strong>
              </div>
              <div className="detail-stat">
                <span>Total achats</span>
                <strong>{formatCurrencyDh(selectedCustomer.totalPurchases || 0)}</strong>
              </div>
              <div className="detail-stat">
                <span>Nombre d'achats</span>
                <strong>{selectedCustomer.salesCount || 0}</strong>
              </div>
            </div>

            <div className="customer-credit-row">
              <Badge tone={getCustomerCreditMeta(selectedCustomer.credit || 0).tone}>
                {getCustomerCreditMeta(selectedCustomer.credit || 0).label}
              </Badge>
            </div>

            <SectionCard
              title="Historique des achats"
              description="Toutes les ventes associees a ce client."
              className="embedded-section-card"
            >
              <DataTable
                columns={[
                  { key: "ticketNumber", label: "Ticket" },
                  { key: "date", label: "Date" },
                  { key: "storeName", label: "Magasin" },
                  { key: "cashRegisterName", label: "Caisse" },
                  { key: "total", label: "Total" },
                  { key: "paymentMethod", label: "Paiement" },
                  { key: "status", label: "Statut" },
                ]}
                data={selectedCustomerSales}
                emptyTitle={
                  isLoadingDetails ? "Chargement..." : "Aucun achat trouve"
                }
                emptyDescription={
                  isLoadingDetails
                    ? "Recuperation de l'historique en cours."
                    : "Ce client n'a encore aucun achat."
                }
                renderRow={(sale) => {
                  const statusMeta = getSaleStatusMeta(sale.status);

                  return (
                    <tr key={sale.id}>
                      <td>
                        <strong>{sale.ticketNumber}</strong>
                      </td>
                      <td>{formatDateTime(sale.date)}</td>
                      <td>{sale.storeName || "-"}</td>
                      <td>{sale.cashRegisterName || "-"}</td>
                      <td>{formatCurrencyDh(sale.total || 0)}</td>
                      <td>{sale.paymentMethod || "-"}</td>
                      <td>
                        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      </td>
                    </tr>
                  );
                }}
              />
            </SectionCard>

            <SectionCard
              title="Historique paiements credit"
              description="Paiements saisis pour reduire le credit client."
              className="embedded-section-card"
            >
              <DataTable
                columns={[
                  { key: "date", label: "Date" },
                  { key: "amount", label: "Montant" },
                  { key: "note", label: "Note" },
                ]}
                data={selectedCustomer.paymentHistory || []}
                emptyTitle="Aucun paiement trouve"
                emptyDescription="Aucun paiement de credit n'a encore ete enregistre."
                renderRow={(payment) => (
                  <tr key={payment.id}>
                    <td>{formatDateTime(payment.date)}</td>
                    <td>{formatCurrencyDh(payment.amount || 0)}</td>
                    <td>{payment.note || "-"}</td>
                  </tr>
                )}
              />
            </SectionCard>
          </>
        ) : null}
      </Modal>

      <Modal
        isOpen={payCreditModal.isOpen}
        eyebrow="Paiement credit"
        title="Payer le credit client"
        description="Enregistrez un paiement partiel ou total du credit du client."
        onClose={closePayCreditModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closePayCreditModal}
              disabled={isSubmittingCreditPayment}
            >
              Annuler
            </button>
            <button
              className="primary-button"
              type="submit"
              form="pay-customer-credit-form"
              disabled={isSubmittingCreditPayment}
            >
              {isSubmittingCreditPayment ? "Enregistrement..." : "Valider paiement"}
            </button>
          </>
        }
      >
        <form
          className="form-grid"
          id="pay-customer-credit-form"
          onSubmit={handleSubmitCreditPayment}
        >
          {creditPaymentError ? (
            <div className="inline-notice error">{creditPaymentError}</div>
          ) : null}

          {payCreditModal.customer ? (
            <div className="delete-product-summary">
              <p className="delete-product-name">
                Client #{payCreditModal.customer.customerNumber} - {payCreditModal.customer.name}
              </p>
              <p className="delete-product-meta">
                Credit actuel: {formatCurrencyDh(payCreditModal.customer.credit || 0)}
              </p>
            </div>
          ) : null}

          <div className="field-group">
            <label className="field-label" htmlFor="customer-credit-amount">
              Montant paye
            </label>
            <input
              id="customer-credit-amount"
              className="text-input"
              type="number"
              min="0"
              step="0.01"
              value={creditPaymentAmount}
              onChange={(event) => {
                setCreditPaymentError("");
                setCreditPaymentAmount(event.target.value);
              }}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="customer-credit-note">
              Note
            </label>
            <textarea
              id="customer-credit-note"
              className="text-input"
              rows="4"
              value={creditPaymentNote}
              onChange={(event) => {
                setCreditPaymentError("");
                setCreditPaymentNote(event.target.value);
              }}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        eyebrow="Suppression client"
        title="Supprimer ce client"
        description="Etes-vous sur de vouloir supprimer ce client ?"
        onClose={closeDeleteModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeDeleteModal}
              disabled={isDeletingCustomer}
            >
              Annuler
            </button>
            <button
              className="table-action-button danger"
              type="button"
              onClick={handleDeleteCustomer}
              disabled={
                isDeletingCustomer || deleteModal.customer?.customerNumber === 1
              }
            >
              {isDeletingCustomer ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        {deleteError ? (
          <div className="inline-notice error">{deleteError}</div>
        ) : null}

        {deleteModal.customer ? (
          <div className="delete-product-summary">
            <p className="delete-product-name">
              Client #{deleteModal.customer.customerNumber} - {deleteModal.customer.name}
            </p>
            <p className="delete-product-meta">
              Credit: {formatCurrencyDh(deleteModal.customer.credit || 0)}
            </p>
            <p className="delete-product-meta">
              Total achats: {formatCurrencyDh(deleteModal.customer.totalPurchases || 0)}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default CustomersPage;
