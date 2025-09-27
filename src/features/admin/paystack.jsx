// src/pages/admin/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
import AdminLayout from "../../features/admin/layout/AdminLayout";

export default function AdminPanel() {
  const [keys, setKeys] = useState([]);
  const [service, setService] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [editingKeyId, setEditingKeyId] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [editingAccountId, setEditingAccountId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  useEffect(() => {
    fetchKeys();
    fetchAccounts();
  }, []);

  const fetchKeys = async () => {
    const { data, error } = await supabase.from("payment_keys").select("*");
    if (error) setError(error.message);
    else setKeys(data || []);
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from("bank_accounts").select("*");
    if (error) setError(error.message);
    else setAccounts(data || []);
  };

  const handleSaveKey = async () => {
    if (!service || !keyName || !keyValue)
      return setError("All fields are required");
    setLoading(true);
    setError("");
    try {
      if (editingKeyId) {
        const { error } = await supabase
          .from("payment_keys")
          .update({
            service,
            key_name: keyName,
            key_value: keyValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingKeyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_keys")
          .insert([{ service, key_name: keyName, key_value: keyValue }]);
        if (error) throw error;
      }
      setService("");
      setKeyName("");
      setKeyValue("");
      setEditingKeyId(null);
      fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!accountName || !accountNumber || !bankName)
      return setError("All fields are required");
    setLoading(true);
    setError("");
    try {
      if (editingAccountId) {
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            account_name: accountName,
            account_number: accountNumber,
            bank_name: bankName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAccountId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert([
            {
              account_name: accountName,
              account_number: accountNumber,
              bank_name: bankName,
            },
          ]);
        if (error) throw error;
      }
      setAccountName("");
      setAccountNumber("");
      setBankName("");
      setEditingAccountId(null);
      fetchAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditKey = (k) => {
    setService(k.service);
    setKeyName(k.key_name);
    setKeyValue(k.key_value);
    setEditingKeyId(k.id);
  };

  const handleEditAccount = (a) => {
    setAccountName(a.account_name);
    setAccountNumber(a.account_number);
    setBankName(a.bank_name);
    setEditingAccountId(a.id);
  };

  const confirmDelete = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    let error;
    if (deleteType === "key")
      ({ error } = await supabase
        .from("payment_keys")
        .delete()
        .eq("id", deleteItem.id));
    else
      ({ error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", deleteItem.id));
    if (error) setError(error.message);
    else {
      if (deleteType === "key") fetchKeys();
      else fetchAccounts();
    }
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteType(null);
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  return (
    <AdminLayout>
      <div className="p-4 space-y-10">
        {error && <p className="text-red-500">{error}</p>}

        {/* Payment Keys */}
        <section>
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Payment Keys
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 mb-4">
            {/* Service Dropdown */}
            <select
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">Select Service</option>
              <option value="paystack">Paystack</option>
              <option value="stripe">Stripe</option>
              <option value="flutterwave">Flutterwave</option>
            </select>

            {/* Key Type */}
            <select
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            >
              <option value="">Select Key Type</option>
              <option value="public_key">Public Key</option>
              <option value="secret_key">Secret Key</option>
            </select>

            {/* Key Value */}
            <input
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              type="password"
              placeholder="Key Value"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
            />

            <button
              onClick={handleSaveKey}
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 text-black rounded font-bold hover:bg-yellow-400"
            >
              {loading
                ? "Saving..."
                : editingKeyId
                ? "Update Key"
                : "Add Key"}
            </button>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-4 sm:hidden">
            {keys.map((k) => (
              <div
                key={k.id}
                className="bg-gray-800 p-4 rounded shadow flex flex-col gap-2"
              >
                <p>
                  <span className="font-bold">Service:</span> {k.service}
                </p>
                <p>
                  <span className="font-bold">Key Name:</span> {k.key_name}
                </p>
                <p>
                  <span className="font-bold">Key Value:</span>{" "}
                  {k.key_value ? "••••••••" : ""}
                </p>
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    onClick={() => handleEditKey(k)}
                    className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(k, "key")}
                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-400"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => copyToClipboard(k.key_value)}
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-400"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border border-gray-600 min-w-[600px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Key Name</th>
                  <th className="px-4 py-2">Key Value</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-gray-600">
                    <td className="px-4 py-2">{k.service}</td>
                    <td className="px-4 py-2">{k.key_name}</td>
                    <td className="px-4 py-2">
                      {k.key_value ? "••••••••" : ""}
                    </td>
                    <td className="px-4 py-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditKey(k)}
                        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(k, "key")}
                        className="px-3 py-1 bg-red-600 rounded hover:bg-red-400"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => copyToClipboard(k.key_value)}
                        className="px-3 py-1 bg-green-600 rounded hover:bg-green-400"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bank Accounts */}
        <section>
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Bank Accounts
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 mb-4">
            <input
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              placeholder="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <input
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <input
              className="px-4 py-2 rounded text-black flex-1 min-w-[150px]"
              placeholder="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <button
              onClick={handleSaveAccount}
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 text-black rounded font-bold hover:bg-yellow-400"
            >
              {loading
                ? "Saving..."
                : editingAccountId
                ? "Update Account"
                : "Add Account"}
            </button>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-4 sm:hidden">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="bg-gray-800 p-4 rounded shadow flex flex-col gap-2"
              >
                <p>
                  <span className="font-bold">Account Name:</span>{" "}
                  {a.account_name}
                </p>
                <p>
                  <span className="font-bold">Account Number:</span>{" "}
                  {a.account_number}
                </p>
                <p>
                  <span className="font-bold">Bank:</span> {a.bank_name}
                </p>
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    onClick={() => handleEditAccount(a)}
                    className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(a, "account")}
                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-400"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${a.account_number} - ${a.account_name} (${a.bank_name})`
                      )
                    }
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-400"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border border-gray-600 min-w-[600px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Account Name</th>
                  <th className="px-4 py-2">Account Number</th>
                  <th className="px-4 py-2">Bank</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t border-gray-600">
                    <td className="px-4 py-2">{a.account_name}</td>
                    <td className="px-4 py-2">{a.account_number}</td>
                    <td className="px-4 py-2">{a.bank_name}</td>
                    <td className="px-4 py-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditAccount(a)}
                        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(a, "account")}
                        className="px-3 py-1 bg-red-600 rounded hover:bg-red-400"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${a.account_number} - ${a.account_name} (${a.bank_name})`
                          )
                        }
                        className="px-3 py-1 bg-green-600 rounded hover:bg-green-400"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#0D1B2A] p-6 rounded-lg w-full max-w-sm text-white border border-yellow-500">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-6">
                Are you sure you want to delete this{" "}
                {deleteType === "key" ? "key" : "account"}?
              </p>
              <div className="flex justify-end gap-4 flex-wrap">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
