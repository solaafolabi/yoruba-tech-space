export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded border border-gray-600 bg-[#0f172a] text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
}
