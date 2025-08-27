const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#FFD700] p-8 rounded-lg max-w-md mx-4 text-black text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🎉 You have been admitted to YorubaTechSpace!</h2>
        <button
          className="bg-[#1B263B] hover:bg-[#0f172a] text-yellow-400 font-bold py-2 px-6 rounded"
          onClick={onClose}
        >
          Proceed to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
