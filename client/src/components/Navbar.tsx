import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { totalItems } = useCart();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'navbar__link navbar__link--active' : 'navbar__link';

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          ShopCart
        </Link>
        <nav className="navbar__nav">
          <NavLink to="/" className={getLinkClass} end>
            Products
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => `${getLinkClass({ isActive })} navbar__cart-link`}>
            <span>Cart</span>
            <span className="navbar__badge" aria-label={`Items in cart: ${totalItems}`}>
              {totalItems}
            </span>
          </NavLink>
          <NavLink to="/admin" className={getLinkClass}>
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
