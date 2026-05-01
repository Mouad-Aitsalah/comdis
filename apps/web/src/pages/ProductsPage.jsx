import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import SearchInput from "../components/SearchInput";
import api from "../services/api";
import { getCurrentUser } from "../store/authStore";
import { cleanupLegacyStoreCache, getStoresCollection } from "../utils/storeAccess";
import { formatCurrencyDh } from "../utils/formatters";

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

const createInitialFormData = (product = null) => ({
  nom: product?.name || "",
  codeBarres: product?.barcode || "",
  categorie: product?.category || "",
  prixAchat:
    product?.purchasePrice === 0 || product?.purchasePrice
      ? String(product.purchasePrice)
      : "",
  prixVente:
    product?.salePrice === 0 || product?.salePrice ? String(product.salePrice) : "",
  seuilMinimum:
    product?.minimumThreshold === 0 || product?.minimumThreshold
      ? String(product.minimumThreshold)
      : "0",
  fournisseurId: product?.supplierId ? String(product.supplierId) : "",
  estActif: product?.active ?? true,
});

const createInitialStocksState = (stores = []) =>
  stores.reduce((accumulator, store) => {
    accumulator[store.id] = "";
    return accumulator;
  }, {});

const getProductWriteUrl = () =>
  api.defaults.baseURL?.replace(/\/api\/?$/, "/products") || "/products";

const buildProductPayload = (formData) => ({
  nom: formData.nom.trim(),
  codeBarres: formData.codeBarres.trim(),
  categorie: formData.categorie.trim(),
  prixAchat: Number(formData.prixAchat),
  prixVente: Number(formData.prixVente),
  seuilMinimum: formData.seuilMinimum === "" ? 0 : Number(formData.seuilMinimum),
  fournisseurId: Number(formData.fournisseurId),
  estActif: formData.estActif,
});

function ProductFormFields({
  formData,
  onChange,
  suppliers,
  isLoadingSuppliers,
  stores,
  storesError,
  isLoadingStores,
  initialStocksByStore,
  onInitialStockChange,
  showInitialStocks = false,
}) {
  return (
    <>
      <div className="field-group">
        <label className="field-label" htmlFor="product-name">
          Nom du produit
        </label>
        <input
          id="product-name"
          className="text-input"
          type="text"
          name="nom"
          value={formData.nom}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-barcode">
          Code-barres
        </label>
        <input
          id="product-barcode"
          className="text-input"
          type="text"
          name="codeBarres"
          value={formData.codeBarres}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-category">
          {"Cat\u00E9gorie"}
        </label>
        <input
          id="product-category"
          className="text-input"
          type="text"
          name="categorie"
          value={formData.categorie}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-purchase-price">
          Prix d'achat
        </label>
        <input
          id="product-purchase-price"
          className="text-input"
          type="number"
          min="0"
          step="0.01"
          name="prixAchat"
          value={formData.prixAchat}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-sale-price">
          Prix de vente
        </label>
        <input
          id="product-sale-price"
          className="text-input"
          type="number"
          min="0"
          step="0.01"
          name="prixVente"
          value={formData.prixVente}
          onChange={onChange}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-minimum-threshold">
          Seuil minimum
        </label>
        <input
          id="product-minimum-threshold"
          className="text-input"
          type="number"
          min="0"
          step="1"
          name="seuilMinimum"
          value={formData.seuilMinimum}
          onChange={onChange}
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="product-supplier">
          Fournisseur
        </label>
        <select
          id="product-supplier"
          className="text-input select-input"
          name="fournisseurId"
          value={formData.fournisseurId}
          onChange={onChange}
          disabled={isLoadingSuppliers}
          required
        >
          <option value="">
            {isLoadingSuppliers
              ? "Chargement des fournisseurs..."
              : "Selectionner un fournisseur"}
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name || supplier.nom}
            </option>
          ))}
        </select>
      </div>

      <label className="checkbox-field" htmlFor="product-active-status">
        <input
          id="product-active-status"
          type="checkbox"
          name="estActif"
          checked={formData.estActif}
          onChange={onChange}
        />
        <span>Statut actif</span>
      </label>

      {showInitialStocks ? (
        <div className="initial-stock-section">
          <div>
            <p className="section-card-title">Stock initial par magasin</p>
            <p className="section-card-description">
              Laissez vide pour envoyer 0. Chaque magasin recevra une ligne de stock.
            </p>
          </div>

          {storesError ? <div className="inline-notice error">{storesError}</div> : null}

          {isLoadingStores ? (
            <div className="inline-notice info">Chargement des magasins...</div>
          ) : null}

          {!isLoadingStores && !storesError ? (
            stores.length ? (
              <div className="initial-stock-grid">
                {stores.map((store) => (
                  <div className="field-group" key={store.id}>
                    <label
                      className="field-label"
                      htmlFor={`initial-stock-${store.id}`}
                    >
                      {store.name}
                    </label>
                    <input
                      id={`initial-stock-${store.id}`}
                      className="text-input"
                      type="number"
                      min="0"
                      step="1"
                      value={initialStocksByStore[store.id] ?? ""}
                      onChange={(event) =>
                        onInitialStockChange(store.id, event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="inline-notice warning">
                Aucun magasin disponible pour definir le stock initial.
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState("");
  const [productModal, setProductModal] = useState({
    isOpen: false,
    mode: "add",
    product: null,
  });
  const [productFormData, setProductFormData] = useState(createInitialFormData);
  const [initialStocksByStore, setInitialStocksByStore] = useState({});
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
  });
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const currentUser = getCurrentUser();
  const canManageProducts = currentUser?.role === "admin";

  const fetchProducts = async () => {
    const response = await api.get("/products");
    setProducts(getCollection(response.data, ["data", "products"]));
  };

  const fetchSuppliers = async () => {
    const response = await api.get("/suppliers");
    setSuppliers(getCollection(response.data, ["data", "suppliers"]));
  };

  const fetchStores = async () => {
    try {
      const response = await api.get("/stores");
      const storesList = getStoresCollection(response.data);
      setStores(storesList);
      setStoresError("");
      return storesList;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Impossible de charger les magasins pour le moment.";
      setStores([]);
      setStoresError(message);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      cleanupLegacyStoreCache();
      setIsLoading(true);
      setIsLoadingSuppliers(true);
      setIsLoadingStores(true);
      setErrorMessage("");
      setStoresError("");

      const requests = [api.get("/products")];

      if (canManageProducts) {
        requests.push(api.get("/suppliers"));
        requests.push(api.get("/stores"));
      }

      const [productsResult, suppliersResult, storesResult] = await Promise.allSettled(requests);

      if (!isMounted) {
        return;
      }

      if (productsResult.status === "fulfilled") {
        setProducts(getCollection(productsResult.value.data, ["data", "products"]));
      } else {
        setErrorMessage(
          productsResult.reason?.response?.data?.message ||
            "Impossible de charger les produits pour le moment."
        );
      }

      if (!canManageProducts) {
        setSuppliers([]);
        setStores([]);
      } else if (suppliersResult?.status === "fulfilled") {
        setSuppliers(getCollection(suppliersResult.value.data, ["data", "suppliers"]));
      } else {
        setNotice({
          type: "warning",
          message:
            suppliersResult?.reason?.response?.data?.message ||
            "Impossible de charger les fournisseurs pour le moment.",
        });
      }

      if (!canManageProducts) {
        setStores([]);
        setStoresError("");
      } else if (storesResult?.status === "fulfilled") {
        const storesList = getStoresCollection(storesResult.value.data);
        setStores(storesList);
        setStoresError("");
      } else {
        setStores([]);
        setStoresError(
          storesResult?.reason?.response?.data?.message ||
            "Impossible de charger les magasins pour le moment."
        );
      }

      if (isMounted) {
        setIsLoading(false);
        setIsLoadingSuppliers(false);
        setIsLoadingStores(false);
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [canManageProducts]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
          return true;
        }

        return (
          product.name?.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.supplierName?.toLowerCase().includes(query)
        );
      }),
    [products, searchTerm]
  );

  const ensureSuppliersLoaded = async () => {
    if (!canManageProducts || suppliers.length || isLoadingSuppliers) {
      return;
    }

    setIsLoadingSuppliers(true);

    try {
      await fetchSuppliers();
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const ensureStoresLoaded = async () => {
    if (!canManageProducts || stores.length || isLoadingStores) {
      return stores;
    }

    setIsLoadingStores(true);

    try {
      return await fetchStores();
    } finally {
      setIsLoadingStores(false);
    }
  };

  const openProductModal = async (mode, product = null) => {
    setNotice({ type: "", message: "" });
    setProductModalError("");
    setProductFormData(createInitialFormData(product));
    setInitialStocksByStore(createInitialStocksState(stores));
    setProductModal({
      isOpen: true,
      mode,
      product,
    });

    try {
      await ensureSuppliersLoaded();
      const loadedStores = await ensureStoresLoaded();

      if (mode === "add") {
        setInitialStocksByStore(createInitialStocksState(loadedStores || stores));
      }
    } catch (error) {
      setProductModalError(
        error.response?.data?.message ||
          "Impossible de charger les donnees necessaires pour le produit."
      );
    }
  };

  const closeProductModal = () => {
    if (isSubmittingProduct) {
      return;
    }

    setProductModal({
      isOpen: false,
      mode: "add",
      product: null,
    });
    setProductFormData(createInitialFormData());
    setInitialStocksByStore(createInitialStocksState(stores));
    setProductModalError("");
  };

  const resetProductModal = () => {
    setProductModal({
      isOpen: false,
      mode: "add",
      product: null,
    });
    setProductFormData(createInitialFormData());
    setInitialStocksByStore(createInitialStocksState(stores));
    setProductModalError("");
  };

  const openDeleteModal = (product) => {
    setNotice({ type: "", message: "" });
    setDeleteModalError("");
    setDeleteModal({
      isOpen: true,
      product,
    });
  };

  const closeDeleteModal = () => {
    if (isDeletingProduct) {
      return;
    }

    setDeleteModal({
      isOpen: false,
      product: null,
    });
    setDeleteModalError("");
  };

  const resetDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      product: null,
    });
    setDeleteModalError("");
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setProductModalError("");
    setProductFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleInitialStockChange = (storeId, value) => {
    setProductModalError("");
    setInitialStocksByStore((current) => ({
      ...current,
      [storeId]: value,
    }));
  };

  const validateForm = (formData) => {
    if (!formData.nom.trim()) {
      return "Le nom du produit est obligatoire.";
    }

    if (!formData.codeBarres.trim()) {
      return "Le code-barres est obligatoire.";
    }

    if (!formData.categorie.trim()) {
      return "La cat\u00E9gorie est obligatoire.";
    }

    if (formData.prixAchat === "") {
      return "Le prix d'achat est obligatoire.";
    }

    if (formData.prixVente === "") {
      return "Le prix de vente est obligatoire.";
    }

    if (!formData.fournisseurId) {
      return "Le fournisseur est obligatoire.";
    }

    return "";
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm(productFormData);

    if (validationMessage) {
      setProductModalError(validationMessage);
      return;
    }

    try {
      setIsSubmittingProduct(true);
      setProductModalError("");

      const payload = {
        ...buildProductPayload(productFormData),
        ...(productModal.mode === "add"
          ? {
              initialStocks: stores.map((store) => ({
                storeId: store.id,
                quantity:
                  initialStocksByStore[store.id] === "" ||
                  initialStocksByStore[store.id] === undefined
                    ? 0
                    : Number(initialStocksByStore[store.id]),
              })),
            }
          : {}),
      };

      if (productModal.mode === "edit" && productModal.product?.id) {
        await api.put(`${getProductWriteUrl()}/${productModal.product.id}`, payload);
      } else {
        await api.post(getProductWriteUrl(), payload);
      }

      await fetchProducts();
      resetProductModal();
      setNotice({
        type: "success",
        message:
          productModal.mode === "edit"
            ? "Produit modifi\u00E9 avec succ\u00E8s."
            : "Produit ajout\u00E9 avec succ\u00E8s.",
      });
    } catch (error) {
      setProductModalError(
        error.response?.data?.message ||
          (productModal.mode === "edit"
            ? "Impossible de modifier le produit pour le moment."
            : "Impossible d'ajouter le produit pour le moment.")
      );
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.product?.id) {
      return;
    }

    try {
      setIsDeletingProduct(true);
      setDeleteModalError("");

      await api.delete(`${getProductWriteUrl()}/${deleteModal.product.id}`);
      await fetchProducts();
      resetDeleteModal();
      setNotice({
        type: "success",
        message: "Produit supprim\u00E9 avec succ\u00E8s.",
      });
    } catch (error) {
      setDeleteModalError(
        error.response?.data?.message ||
          "Impossible de supprimer le produit pour le moment."
      );
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const productModalTitle =
    productModal.mode === "edit" ? "Modifier le produit" : "Ajouter un produit";
  const productModalEyebrow =
    productModal.mode === "edit" ? "Edition produit" : "Nouveau produit";
  const productModalDescription =
    productModal.mode === "edit"
      ? "Mettez \u00E0 jour les informations du produit s\u00E9lectionn\u00E9."
      : "Renseignez les informations principales pour ajouter une nouvelle reference au catalogue.";
  const productModalSubmitLabel =
    productModal.mode === "edit"
      ? isSubmittingProduct
        ? "Enregistrement..."
        : "Enregistrer"
      : isSubmittingProduct
      ? "Ajout en cours..."
      : "Ajouter produit";

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Produits"
        description="Piloter les references, les prix et la disponibilite produit sur les points de vente."
        actions={
          canManageProducts ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => openProductModal("add")}
            >
              Ajouter produit
            </button>
          ) : null
        }
      />

      {notice.message ? (
        <div className={`inline-notice ${notice.type}`}>{notice.message}</div>
      ) : null}

      <SectionCard
        title="Catalogue produits"
        description="Rechercher une reference par nom ou code-barres."
      >
        <div className="table-toolbar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par nom ou code-barres"
          />
        </div>

        {errorMessage ? (
          <div className="inline-notice error">{errorMessage}</div>
        ) : null}

        <DataTable
          columns={[
            { key: "product", label: "Produit" },
            { key: "barcode", label: "Code-barres" },
            { key: "supplier", label: "Fournisseur" },
            { key: "category", label: "Categorie" },
            { key: "purchasePrice", label: "Prix achat" },
            { key: "salePrice", label: "Prix vente" },
            { key: "status", label: "Statut" },
            { key: "actions", label: "Actions" },
          ]}
          data={filteredProducts}
          emptyTitle={isLoading ? "Chargement des produits..." : "Aucun produit trouve"}
          emptyDescription={
            isLoading
              ? "Veuillez patienter pendant la recuperation des donnees."
              : "Essayez un autre nom ou code-barres."
          }
          renderRow={(product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
              </td>
              <td>{product.barcode}</td>
              <td>{product.supplierName || "-"}</td>
              <td>{product.category}</td>
              <td>{formatCurrencyDh(product.purchasePrice || 0)}</td>
              <td>{formatCurrencyDh(product.salePrice || 0)}</td>
              <td>
                <Badge tone={product.active ? "success" : "warning"}>
                  {product.active ? "Actif" : "Inactif"}
                </Badge>
              </td>
              <td>
                {canManageProducts ? (
                  <div className="table-action-row">
                    <button
                      className="table-action-button"
                      type="button"
                      onClick={() => openProductModal("edit", product)}
                    >
                      Edit
                    </button>
                    <button
                      className="table-action-button danger"
                      type="button"
                      onClick={() => openDeleteModal(product)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="muted-text">-</span>
                )}
              </td>
            </tr>
          )}
        />
      </SectionCard>

      <Modal
        isOpen={productModal.isOpen}
        eyebrow={productModalEyebrow}
        title={productModalTitle}
        description={productModalDescription}
        onClose={closeProductModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeProductModal}
              disabled={isSubmittingProduct}
            >
              Annuler
            </button>
            <button
              className="primary-button"
              type="submit"
              form="product-form"
              disabled={isSubmittingProduct}
            >
              {productModalSubmitLabel}
            </button>
          </>
        }
      >
        <form className="form-grid" id="product-form" onSubmit={handleSubmitProduct}>
          {productModalError ? (
            <div className="inline-notice error">{productModalError}</div>
          ) : null}

          <ProductFormFields
            formData={productFormData}
            onChange={handleFormChange}
            suppliers={suppliers}
            isLoadingSuppliers={isLoadingSuppliers}
            stores={stores}
            storesError={storesError}
            isLoadingStores={isLoadingStores}
            initialStocksByStore={initialStocksByStore}
            onInitialStockChange={handleInitialStockChange}
            showInitialStocks={productModal.mode === "add"}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        eyebrow="Suppression produit"
        title="Supprimer ce produit"
        description={"\u00CAtes-vous s\u00FBr de vouloir supprimer ce produit ?"}
        onClose={closeDeleteModal}
        actions={
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={closeDeleteModal}
              disabled={isDeletingProduct}
            >
              Annuler
            </button>
            <button
              className="table-action-button danger"
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeletingProduct}
            >
              {isDeletingProduct ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        {deleteModalError ? (
          <div className="inline-notice error">{deleteModalError}</div>
        ) : null}

        {deleteModal.product ? (
          <div className="delete-product-summary">
            <p className="delete-product-name">{deleteModal.product.name}</p>
            <p className="delete-product-meta">
              Code-barres: {deleteModal.product.barcode}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default ProductsPage;
