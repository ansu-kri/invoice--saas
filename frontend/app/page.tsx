export default function HomePage() {
  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Invoice SaaS 🚀</h1>
      <p>Manage your invoices efficiently.</p>

      <div style={{ marginTop: "20px" }}>
        <a href="/login" style={{ marginRight: "15px" }}>
          Login
        </a>
        <a href="/register">Register</a>
      </div>
    </main>
  );
}