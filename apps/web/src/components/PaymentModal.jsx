import { useState } from "react";
import Modal from "./Modal";
import { formatCurrencyDh } from "../utils/formatters";

const paymentOptions = [
  { label: "Especes", value: "cash" },
  { label: "Carte bancaire", value: "card" },
  { label: "Credit", value: "credit" },
];

function PaymentModal({
  isOpen,
  totalAmount,
  totalItems,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].value);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(paymentMethod);
  };

  const handleClose = () => {
    setPaymentMethod(paymentOptions[0].value);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      eyebrow="Validation paiement"
      title="Confirmer la transaction"
      description="Confirmation finale avant enregistrement de la vente."
      onClose={handleClose}
      actions={
        <>
          <button
            className="ghost-button"
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Annuler
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Confirmation..." : "Confirmer"}
          </button>
        </>
      }
    >
        <div className="modal-summary">
          <div>
            <span>Total articles</span>
            <strong>{totalItems}</strong>
          </div>
          <div>
            <span>Montant a payer</span>
            <strong>{formatCurrencyDh(totalAmount)}</strong>
          </div>
        </div>

        <div className="payment-option-grid">
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              className={`payment-option ${
                paymentMethod === option.value ? "selected" : ""
              }`}
              type="button"
              onClick={() => setPaymentMethod(option.value)}
              disabled={isProcessing}
            >
              {option.label}
            </button>
          ))}
        </div>

        {paymentMethod === "credit" ? (
          <div className="inline-notice warning">
            ⚠️ Le montant sera ajoute au credit du client.
          </div>
        ) : null}
    </Modal>
  );
}

export default PaymentModal;
