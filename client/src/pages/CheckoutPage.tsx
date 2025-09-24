import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const CheckoutPage = () => {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = (formData.get('fullName') as string | null) ?? '';

    setIsSubmitting(true);
    setCustomerName(name);
    clearCart();
    setIsSubmitting(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <section className="page checkout-success">
        <header className="page__header">
          <h1 className="page__title">Order confirmed</h1>
          <p className="page__subtitle">Thank you for shopping with us!</p>
        </header>
        <div className="checkout-success__card">
          <h2>Payment successful (placeholder)</h2>
          <p>
            {customerName ? `${customerName}, ` : ''}your payment has been processed successfully. You will receive an
            order confirmation email shortly.
          </p>
          <Link to="/" className="button button--primary">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page checkout-page">
      <header className="page__header">
        <h1 className="page__title">Checkout</h1>
        <p className="page__subtitle">Provide your shipping details to complete the purchase.</p>
      </header>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" type="text" placeholder="Jane Doe" required autoComplete="name" />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              required
              autoComplete="email"
            />

            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St"
              required
              autoComplete="street-address"
            />

            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" placeholder="Taipei" required autoComplete="address-level2" />

            <label htmlFor="postalCode">Postal code</label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              placeholder="100"
              required
              autoComplete="postal-code"
            />

            <label htmlFor="country">Country</label>
            <input id="country" name="country" type="text" placeholder="Taiwan" required autoComplete="country" />
          </div>

          <button type="submit" className="button button--primary" disabled={isSubmitting || totalItems === 0}>
            {isSubmitting ? 'Processing...' : 'Complete payment (placeholder)'}
          </button>

          {totalItems === 0 && (
            <p className="form-hint">Add items to your cart to complete the checkout.</p>
          )}
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {items.length === 0 ? (
            <p className="checkout-summary__empty">Your cart is empty.</p>
          ) : (
            <ul className="checkout-summary__list">
              {items.map((item) => (
                <li key={item.id} className="checkout-summary__item">
                  <div>
                    <span className="checkout-summary__name">{item.name}</span>
                    <span className="checkout-summary__qty">Qty {item.qty}</span>
                  </div>
                  <span className="checkout-summary__price">{currencyFormatter.format(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="checkout-summary__total">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(subtotal)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
