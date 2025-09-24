import './App.css';

const customerFeatures = [
  'Browse products with images, name, price',
  'Add, remove, and update items in the cart',
  'Complete a checkout flow with address and payment placeholder',
];

const adminFeatures = [
  'Authenticate admins with JWT-based login and logout',
  'Add, edit, and delete products',
  'Upload and manage product images',
];

const systemFeatures = [
  'Persist data in MongoDB Atlas',
  'Provide a responsive UI across devices',
];

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="feature-card">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function App() {
  return (
    <div className="app">
      <header className="hero">
        <h1>Online Shopping Cart</h1>
        <p>
          This React + Vite + TypeScript client will power the storefront for the
          shopping cart platform.
        </p>
      </header>
      <main className="grid">
        <FeatureList title="Customer Experience" items={customerFeatures} />
        <FeatureList title="Admin Experience" items={adminFeatures} />
        <FeatureList title="System Capabilities" items={systemFeatures} />
      </main>
    </div>
  );
}

export default App;
