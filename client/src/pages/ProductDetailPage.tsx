import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import QuantityInput from '../components/QuantityInput';
import { useCart } from '../context/CartContext';
import { getProduct, type Product } from '../lib/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setError('Product not found.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProduct(id);
        if (!cancelled) {
          setProduct(data);
        }
      } catch (_err) {
        if (!cancelled) {
          setError('Unable to load this product.');
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setQuantity(1);
  }, [product?.id]);

  const maxQty = useMemo(() => {
    if (!product) {
      return undefined;
    }

    if (typeof product.stock === 'number' && product.stock > 0) {
      return product.stock;
    }

    return undefined;
  }, [product]);

  const isOutOfStock = useMemo(() => {
    if (!product) {
      return false;
    }

    if (typeof product.stock !== 'number') {
      return false;
    }

    return product.stock <= 0;
  }, [product]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) {
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: quantity,
    });
  };

  return (
    <section className="page">
      {loading && (
        <div className="product-detail product-detail--loading">
          <div className="product-detail__image-skeleton" />
          <div className="product-detail__content-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        </div>
      )}

      {!loading && error && <div className="alert alert--error">{error}</div>}

      {!loading && product && (
        <div className="product-detail">
          <div className="product-detail__image-wrapper">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="product-detail__image" />
            ) : (
              <div className="product-detail__image-placeholder" aria-hidden="true">
                <span>{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="product-detail__info">
            <h1 className="product-detail__title">{product.name}</h1>
            <p className="product-detail__price">{currencyFormatter.format(product.price)}</p>
            {product.description && <p className="product-detail__description">{product.description}</p>}
            <p
              className={`product-detail__stock ${isOutOfStock ? 'product-detail__stock--out' : 'product-detail__stock--in'}`}
            >
              {isOutOfStock
                ? 'Out of stock'
                : typeof product.stock === 'number'
                  ? `In stock: ${product.stock}`
                  : 'In stock'}
            </p>
            <div className="product-detail__actions">
              <QuantityInput value={quantity} onChange={setQuantity} min={1} max={maxQty} disabled={isOutOfStock} />
              <button
                type="button"
                className="button button--primary"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetailPage;
