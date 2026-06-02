export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        position: "relative",
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
