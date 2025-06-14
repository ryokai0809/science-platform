export function Button({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-[#EA6137] hover:bg-[#d35630] text-white font-bold py-2 px-4 rounded-full ${className}`}
    >
      {children}
    </button>
  );
}
