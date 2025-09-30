import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { getHeroSettings, getProducts, type HeroSettings, type Product } from '../lib/api';

const ITEMS_PER_BATCH = 8;

const HomeProductsPage = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHero = async () => {
      try {
        const data = await getHeroSettings();

        if (!cancelled) {
          setHeroSettings(data);
        }
      } catch (err) {
        if (!cancelled) {
          setHeroSettings(null);
        }
      }
    };

    void fetchHero();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProducts();
        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load products. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [products.length]);

  const displayedProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount],
  );

  const hasMore = visibleCount < products.length;

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: 1,
    });
  };

  const skeletons = useMemo(
    () =>
      Array.from({ length: ITEMS_PER_BATCH }, (_, index) => (
        <div className="product-card product-card--skeleton" key={`skeleton-${index}`}>
          <div className="product-card__image-skeleton" />
          <div className="product-card__line" />
          <div className="product-card__line product-card__line--short" />
        </div>
      )),
    [],
  );

  const heroCopy = heroSettings?.copy?.trim()
    ? heroSettings.copy
    : 'Discover products curated to brighten your day and elevate your routine.';
  const heroHasImage = Boolean(heroSettings?.backgroundImageUrl);

  return (
    <section className="page">
      <div
        className={`home-hero${heroHasImage ? ' home-hero--with-image' : ''}`}
        style={heroHasImage ? { backgroundImage: `url(${heroSettings?.backgroundImageUrl})` } : undefined}
      >
        {!heroHasImage && <div className="home-hero__overlay" aria-hidden="true" />}
        <div className="home-hero__content">
          <p className="home-hero__copy">{heroCopy}</p>
        </div>
      </div>
      <header className="page__header">
        <h1 className="page__title">Products</h1>
        <p className="page__subtitle">Browse our curated catalog and discover your next purchase.</p>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="product-grid" aria-live="polite">
        {loading && skeletons}
        {!loading && displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {!loading && !products.length && !error && (
        <div className="empty-state">
          <p>No products available yet. Please check back soon.</p>
        </div>
      )}

      {!loading && hasMore && (
        <div className="page__actions">
          <button type="button" className="button button--secondary" onClick={() => setVisibleCount((count) => count + ITEMS_PER_BATCH)}>
            Load more
          </button>
        </div>
      )}
    </section>
  );
};

export default HomeProductsPage;
