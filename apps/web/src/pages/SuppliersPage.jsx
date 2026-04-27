import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import SectionCard from "../components/SectionCard";
import { getCurrentUser } from "../store/authStore";
import { formatCurrencyDh } from "../utils/formatters";

const createInitialFormData = (supplier = null) => ({
  nom: supplier?.name || "",
  telephone: supplier?.phone || "",
  email: supplier?.email || "",
  adresse: supplier?.address || "",
});

const createInitialSupplierModal = () => ({
  isOpen: false,
  mode: "add",
  supplier: null,
});

const createInitialDeleteModal = () => ({
  isOpen: false,
  supplier: null,
});

const createInitialProductsModal = () => ({
  isOpen: false,
  supplier: null,
});

const getSuppliersCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.suppliers)) {
    return payload.suppliers;
  }

  return [];
};

const getProductsCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  return [];
};

const getSupplierWriteUrl = () =>
  api.defaults.baseURL?.replace(/\/api\/?$/, "/suppliers") || "/suppliers";

const buildSupplierPayload = (formData) => ({
  nom: formData.nom.trim(),
  telephone: formData.telephone.trim(),
  email: formData.email.trim(),
  adresse: formData.adresse.trim(),
});

const isProductLinkedToSupplier = (product, supplier) => {
  if (!product || !supplier) {
    return false;
  }

  const productSupplierId = product.supplierId ?? product.fournisseurId ?? product.supplier?.id;

  if (productSupplierId !== undefined && productSupplierId !== null) {
    return Number(productSupplierId) === Number(supplier.id);
  }

  const productSupplierName = product.supplierName || product.fournisseurNom;

  return (
    typeof productSupplierName === "string" &&
    productSupplierName.trim().toLowerCase() === supplier.name?.trim().toLowerCase()
  );
};

function SupplierFormFields({ formData, onChange }) {
  return (
    <>
      <div className="field-group">
        <label className="field-label" htmlFor="supplier-name">
          Nom fournisseur
        </label>
        <input
          id="supplier-name"
          className="text-input"
          type="text"
          name="nom"
          value={formData.nom}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="supplier-phone">
          {"T\u00E9l\u00E9phone"}
        </label>
        <input
          id="supplier-phone"
          className="text-input"
          type="text"
          name="telephone"
          value={formData.telephone}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="supplier-email">
          Email
        </label>
        <input
          id="supplier-email"
          className="text-input"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="supplier-address">
          Adresse
        </label>
        <input
          id="supplier-address"
          className="text-input"
          type="text"
          name="adresse"
          value={formData.adresse}
          onChange={onChange}
          required
        />
      </div>
    </>
  );
}

function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [supplierModal, setSupplierModal] = useState(createInitialSupplierModal);
  const [supplierFormData, setSupplierFormData] = useState(createInitialFormData);
  const [supplierModalError, setSupplierModalError] = useState("");
  const [deleteModal, setDeleteModal] = useState(createInitialDeleteModal);
  const [deleteModalError, setDeleteModalError] = useState("");
  const [productsModal, setProductsModal] = useState(createInitialProductsModal);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isLoadingSupplierProducts, setIsLoadingSupplierProducts] = useState(false);
  const [productsModalError, setProductsModalError] = useState("");
  const currentUser = getCurrentUser();
  const canManageSuppliers = currentUser?.role === "admin";

  const fetchSuppliers = async () => {
    const response = await api.get("/suppliers");
    setSuppliers(getSuppliersCollection(response.data));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await api.get("/suppliers");
        const list = getSuppliersCollection(response.data);

        if (isMounted) {
          setSuppliers(list);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Impossible de charger les fournisseurs pour le moment."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSuppliers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((supplier) => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
          return true;
        }

        return (
          supplier.name?.toLowerCase().includes(query) ||
          supplier.email?.toLowerCase().includes(query) ||
          supplier.phone?.toLowerCase().includes(query)
        );
      }),
    [searchTerm, suppliers]
  );

  const openSupplierModal = (mode, supplier = null) => {
    setNotice({ type: "", message: "" });
    setSupplierModalError("");
    setSupplierFormData(createInitialFormData(supplier));
    setSupplierModal({
      isOpen: true,
      mode,
      supplier,
    });
  };

  const closeSupplierModal = () => {
    if (isSubmittingSupplier) {
      return;
    }

    setSupplierModal(createInitialSupplierModal());
    setSupplierFormData(createInitialFormData());
    setSupplierModalError("");
  };

  const resetSupplierModal = () => {
    setSupplierModal(createInitialSupplierModal());
    setSupplierFormData(createInitialFormData());
    setSupplierModalError("");
  };

  const openDeleteModal = (supplier) => {
    setNotice({ type: "", message: "" });
    setDeleteModalError("");
    setDeleteModal({
      isOpen: true,
      supplier,
    });
  };

  const closeDeleteModal = () => {
    if (isDeletingSupplier) {
      return;
    }

    setDeleteModal(createInitialDeleteModal());
    setDeleteModalError("");
  };

  const resetDeleteModal = () => {
    setDeleteModal(createInitialDeleteModal());
    setDeleteModalError("");
  };

  const closeProductsModal = () => {
    if (isLoadingSupplierProducts) {
      return;
    }

    setProductsModal(createInitialProductsModal());
    setSupplierProducts([]);
    setProductsModalError("");
  };

  const loadSupplierProducts = async (supplier) => {
    try {
      setIsLoadingSupplierProducts(true);
      setProductsModalError("");

      const response = await api.get("/products", {
        params: { supplierId: supplier.id },
      });
      const products = getProductsCollection(response.data);
      const filteredProducts = products.filter((product) =>
        isProductLinkedToSupplier(product, supplier)
      );

      setSupplierProducts(filteredProducts);
    } catch (error) {
      try {
        const fallbackResponse = await api.get("/products");
        const products = getProductsCollection(fallbackResponse.data);

        setSupplierProducts(
          products.filter((product) => isProductLinkedToSupplier(product, supplier))
        );
      } catch (fallbackError) {
        setSupplierProducts([]);
        setProductsModalError(
          fallbackError.response?.data?.message ||
            error.response?.data?.message ||
            "Impossible de charger les produits de ce fournisseur pour le moment."
        );
      }
    } finally {
      setIsLoadingSupplierProducts(false);
    }
  };

  const openProductsModal = async (supplier) => {
    setNotice({ type: "", message: "" });
    setProductsModal({
      isOpen: true,
      supplier,
    });
    setSupplierProducts([]);
    setProductsModalError("");
    await loadSupplierProducts(supplier);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setSupplierModalError("");
    setSupplierFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!supplierFormData.nom.trim()) {
      return "Le nom du fournisseur est obligatoire.";
    }

    if (!supplierFormData.telephone.trim()) {
      return "Le t\u00E9l\u00E9phone est obligatoire.";
    }

    if (!supplierFormData.email.trim()) {
      return "L'email est obligatoire.";
    }

    if (!supplierFormData.adresse.trim()) {
      return "L'adresse est obligatoire.";
    }

    return "";
  };

  const handleSubmitSupplier = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setSupplierModalError(validationMessage);
      return;
    }

    try {
      setIsSubmittingSupplier(true);
      setSupplierModalError("");

      const payload = buildSupplierPayload(supplierFormData);

      if (supplierModal.mode === "edit" && supplierModal.supplier?.id) {
        await api.put(`${getSupplierWriteUrl()}/${supplierModal.supplier.id}`, payload);
      } else {
        await api.post(getSupplierWriteUrl(), payload);
      }

      await fetchSuppliers();
      resetSupplierModal();
      setNotice({
        type: "success",
        message:
          supplierModal.mode === "edit"
            ? "Fournisseur modifi\u00E9 avec succ\u00E8s."
            : "Fournisseur ajout\u00E9 avec succ\u00E8s.",
      });
    } catch (error) {
      setSupplierModalError(
        error.response?.data?.message ||
          (supplierModal.mode === "edit"
            ? "Impossible de modifier ce fournisseur pour le moment."
            : "Impossible d'ajouter ce fournisseur pour le moment.")
      );
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.supplier?.id) {
      return;
    }

    try {
      setIsDeletingSupplier(true);
      setDeleteModalError("");

      await api.delete(`${getSupplierWriteUrl()}/${deleteModal.supplier.id}`);
      await fetchSuppliers();
      resetDeleteModal();
      setNotice({
        type: "success",
        message: "Fournisseur supprim\u00E9 avec succ\u00E8s.",
      });
    } catch (error) {
      const backendMessage = error.response?.data?.message || "";

      setDeleteModalError(
        backendMessage.includes("lie a des produits")
          ? "Impossible de supprimer ce fournisseur car il est li\u00E9 \u00E0 des produits."
          : backendMessage || "Impossible de supprimer ce fournisseur pour le moment."
      );
    } finally {
      setIsDeletingSupplier(false);
    }
  };

  const supplierModalTitle =
    supplierModal.mode === "edit"
      ? "Modifier le fournisseur"
      : "Ajouter un fournisseur";
  const supplierModalEyebrow =
    supplierModal.mode === "edit" ? "Edition fournisseur" : "Nouveau fournisseur";
  const supplierModalDescription =
    supplierModal.mode === "edit"
      ? "Mettez \u00E0 jour les informations du fournisseur s\u00E9lectionn\u00E9."
      : "Renseignez les coordonn\u00E9es principales pour ajouter un nouveau fournisseur.";
  const supplierSubmitLabel = isSubmittingSupplier
    ? "Enregistrement..."
    : supplierModal.mode === "edit"
    ? "Enregistrer"
    : "Ajouter fournisseur";

  return (
    <div>
      <PageHeader
        eyebrow="Fournisseurs"
        title="Gestion des fournisseurs"
        description="Conserver les contacts, coordonner les approvisionnements et suivre les partenaires actifs."
        actions={
          canManageSuppliers ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => openSupplierModal("add")}
            >
              Ajouter fournisseur
            </button>
          ) : null
        }
      />

      {notice.message ? (
        <div className={`inline-notice ${notice.type}`}>{notice.message}</div>
      ) : null}

      <SectionCard
        title="Liste fournisseurs"
        description="Recherche rapide par nom, email ou numero de telephone."
      >
        <div className="table-toolbar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un fournisseur"
          />
        </div>

        {errorMessage ? (
          <div className="inline-notice error">{errorMessage}</div>
        ) : null}

        <DataTable
          columns={[
            { key: "name", label: "Nom" },
            { key: "phone", label: "Telephone" },
            { key: "email", label: "Email" },
            { key: "address", label: "Adresse" },
            { key: "productsCount", label: "Nb produits" },
            { key: "actions", label: "Actions" },
          ]}
          data={filteredSuppliers}
          emptyTitle={isLoading ? "Chargement..." : "Aucun fournisseur trouve"}
          emptyDescription={
            isLoading
              ? "Recuperation des fournisseurs en cours."
              : "Ajustez votre recherche pour afficher un fournisseur."
          }
          renderRow={(supplier) => (
            <tr key={supplier.id}>
              <td>
                <strong>{supplier.name}</strong>
              </td>
              <td>{supplier.phone || "-"}</td>
              <td>{supplier.email || "-"}</td>
              <td>{supplier.address || "-"}</td>
              <td>{supplier.productsCount || supplier.products?.length || 0}</td>
              <td>
                <div className="table-action-row">
                  <button
                    className="table-action-button"
                    type="button"
                    onClick={() => openProductsModal(supplier)}
                  >
                    Voir produits
                  </button>
                  {canManageSuppliers ? (
                    <>
                    <button
                      className="table-action-button"
                      type="button"
                      onClick={() => openSupplierModal("edit", supplier)}
                    >
                      Edit
                    </button>
                    <button
                      className="table-action-button danger"
                      type="button"
                      onClick={() => openDeleteModal(supplier)}
                    >
                      Delete
                    </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          )}
        />
      </SectionCard>

      <Modal
        isOpen={supplierModal.isOpen}
        eyebrow={supplierModalEyebrow}
        title={supplierModalTitle}
        description={supplierModalDescription}
        onClose={closeSupplierModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeSupplierModal}
              disabled={isSubmittingSupplier}
            >
              Annuler
            </button>
            <button
              className="primary-button"
              type="submit"
              form="supplier-form"
              disabled={isSubmittingSupplier}
            >
              {supplierSubmitLabel}
            </button>
          </>
        }
      >
        <form className="form-grid" id="supplier-form" onSubmit={handleSubmitSupplier}>
          {supplierModalError ? (
            <div className="inline-notice error">{supplierModalError}</div>
          ) : null}

          <SupplierFormFields
            formData={supplierFormData}
            onChange={handleFormChange}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        eyebrow="Suppression fournisseur"
        title="Supprimer ce fournisseur"
        description={"\u00CAtes-vous s\u00FBr de vouloir supprimer ce fournisseur ?"}
        onClose={closeDeleteModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeDeleteModal}
              disabled={isDeletingSupplier}
            >
              Annuler
            </button>
            <button
              className="table-action-button danger"
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeletingSupplier}
            >
              {isDeletingSupplier ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        {deleteModalError ? (
          <div className="inline-notice error">{deleteModalError}</div>
        ) : null}

        {deleteModal.supplier ? (
          <div className="delete-product-summary">
            <p className="delete-product-name">{deleteModal.supplier.name}</p>
            <p className="delete-product-meta">
              {"T\u00E9l\u00E9phone"}: {deleteModal.supplier.phone || "-"}
            </p>
            <p className="delete-product-meta">
              Email: {deleteModal.supplier.email || "-"}
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={productsModal.isOpen}
        eyebrow="Catalogue fournisseur"
        title={
          productsModal.supplier
            ? `Produits fournis par ${productsModal.supplier.name}`
            : "Produits du fournisseur"
        }
        description="Consultez les references rattachees a ce fournisseur."
        onClose={closeProductsModal}
        actions={
          <button className="ghost-button" type="button" onClick={closeProductsModal}>
            Fermer
          </button>
        }
      >
        {productsModal.supplier ? (
          <div className="delete-product-summary">
            <p className="delete-product-name">{productsModal.supplier.name}</p>
            <p className="delete-product-meta">
              {"T\u00E9l\u00E9phone"}: {productsModal.supplier.phone || "-"}
            </p>
            <p className="delete-product-meta">
              Email: {productsModal.supplier.email || "-"}
            </p>
          </div>
        ) : null}

        {productsModalError ? (
          <div className="inline-notice error">{productsModalError}</div>
        ) : null}

        <DataTable
          columns={[
            { key: "name", label: "Nom du produit" },
            { key: "barcode", label: "Code-barres" },
            { key: "category", label: "Categorie" },
            { key: "purchasePrice", label: "Prix achat" },
            { key: "salePrice", label: "Prix vente" },
            { key: "status", label: "Statut actif" },
          ]}
          data={supplierProducts}
          emptyTitle={
            isLoadingSupplierProducts
              ? "Chargement des produits..."
              : "Aucun produit associe a ce fournisseur."
          }
          emptyDescription={
            isLoadingSupplierProducts
              ? "Recuperation des produits en cours."
              : "Aucun produit associe a ce fournisseur."
          }
          renderRow={(product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
              </td>
              <td>{product.barcode || "-"}</td>
              <td>{product.category || "-"}</td>
              <td>{formatCurrencyDh(product.purchasePrice || 0)}</td>
              <td>{formatCurrencyDh(product.salePrice || 0)}</td>
              <td>
                <Badge tone={product.active ? "success" : "warning"}>
                  {product.active ? "Actif" : "Inactif"}
                </Badge>
              </td>
            </tr>
          )}
        />
      </Modal>
    </div>
  );
}

export default SuppliersPage;
