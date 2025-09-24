import { Link } from 'react-router-dom';
import type { Product } from '../lib/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  disabled?: boolean;
};

const ProductCard = ({ product, onAddToCart, disabled }: ProductCardProps) => {
  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-card__image-wrapper">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="product-card__image" loading="lazy" />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true">
            <span>{product.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="product-card__body">
        <Link to={`/product/${product.id}`} className="product-card__title">
          {product.name}
        </Link>
        <p className="product-card__price">{currencyFormatter.format(product.price)}</p>
        <div className="product-card__actions">
          <Link to={`/product/${product.id}`} className="button button--ghost">
            View
          </Link>
          {onAddToCart && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => onAddToCart(product)}
              disabled={disabled}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
