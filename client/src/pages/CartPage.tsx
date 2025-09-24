import { Link } from 'react-router-dom';
import QuantityInput from '../components/QuantityInput';
import { useCart } from '../context/CartContext';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const CartPage = () => {
  const { items, removeItem, setItemQty, clearCart, subtotal } = useCart();
  const isEmpty = items.length === 0;

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Your Cart</h1>
        <p className="page__subtitle">Review the items in your shopping cart before checkout.</p>
      </header>

      {isEmpty ? (
        <div className="empty-state">
          <p>Your cart is empty. Start exploring our products to add items.</p>
          <Link to="/" className="button button--primary">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-list" aria-label="Shopping cart items">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <Link to={`/product/${item.id}`} className="cart-item__image-wrapper" aria-label={`View ${item.name}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="cart-item__image" />
                  ) : (
                    <div className="cart-item__image-placeholder" aria-hidden="true">
                      <span>{item.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </Link>
                <div className="cart-item__details">
                  <Link to={`/product/${item.id}`} className="cart-item__name">
                    {item.name}
                  </Link>
                  <p className="cart-item__price">{currencyFormatter.format(item.price)}</p>
                  <QuantityInput
                    value={item.qty}
                    min={1}
                    onChange={(value) => setItemQty(item.id, value)}
                  />
                </div>
                <div className="cart-item__summary">
                  <p className="cart-item__subtotal">{currencyFormatter.format(item.price * item.qty)}</p>
                  <button type="button" className="button button--text" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div className="cart-summary__row">
              <span>Subtotal</span>
              <span>{currencyFormatter.format(subtotal)}</span>
            </div>
            <p className="cart-summary__note">Shipping and taxes are calculated during checkout.</p>
            <div className="cart-summary__actions">
              <button type="button" className="button button--ghost" onClick={clearCart}>
                Clear cart
              </button>
              <Link to="/checkout" className="button button--primary">
                Proceed to checkout
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
