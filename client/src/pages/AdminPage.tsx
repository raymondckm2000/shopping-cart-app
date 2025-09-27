import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  createProduct,
  getProducts,
  login,
  updateProduct,
  type Product,
} from '../lib/api';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageFile: File | null;
};

const emptyFormState: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageFile: null,
};

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(emptyFormState);
  const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  );
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);

      try {
        const data = await getProducts();

        if (!isCancelled) {
          setProducts(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setProductsError('載入產品列表時發生錯誤，請稍後再試。');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setLoginError('請輸入帳號與密碼。');
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      const response = await login({ username, password });
      setToken(response.token);
    } catch (err) {
      setToken(null);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setLoginError('登入失敗，請確認帳號或密碼。');
        } else if (err.status === 503) {
          setLoginError('尚未設定正式管理帳號，暫時無法登入。');
        } else {
          setLoginError('登入過程發生錯誤，請稍後再試。');
        }
      } else {
        setLoginError('登入過程發生錯誤，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setFormState(emptyFormState);
    setEditingProductId(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setFormState({
      name: product.name,
      description: product.description ?? '',
      price: product.price.toString(),
      stock: product.stock !== undefined ? product.stock.toString() : '',
      imageFile: null,
    });
    setFormMessage(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleCancelEdit = () => {
    resetForm();
    setFormMessage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    handleInputChange('imageFile', file);
  };

  const parsePriceAndStock = () => {
    const trimmedName = formState.name.trim();

    if (!trimmedName) {
      setFormMessage({ type: 'error', text: '請輸入產品名稱。' });
      return null;
    }

    const priceValue = Number(formState.price);

    if (Number.isNaN(priceValue)) {
      setFormMessage({ type: 'error', text: '請輸入有效的價格。' });
      return null;
    }

    let stockValue: number | undefined;

    if (formState.stock.trim() !== '') {
      const parsedStock = Number(formState.stock);

      if (Number.isNaN(parsedStock)) {
        setFormMessage({ type: 'error', text: '請輸入有效的庫存數量。' });
        return null;
      }

      stockValue = parsedStock;
    }

    return {
      name: trimmedName,
      price: priceValue,
      stock: stockValue,
      description: formState.description.trim() || undefined,
      imageFile: formState.imageFile,
    };
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setFormMessage({ type: 'error', text: '請重新登入後再試。' });
      return;
    }

    const parsed = parsePriceAndStock();

    if (!parsed) {
      return;
    }

    setIsSavingProduct(true);
    setFormMessage(null);

    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, parsed, token);
        setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
        setFormMessage({ type: 'success', text: '產品已更新。' });
      } else {
        const created = await createProduct(parsed, token);
        setProducts((prev) => [created, ...prev]);
        setFormMessage({ type: 'success', text: '產品已新增。' });
      }

      resetForm();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          setFormMessage({ type: 'error', text: '送出的資料有誤，請確認後再試。' });
        } else if (error.status === 401) {
          setFormMessage({ type: 'error', text: '登入逾時，請重新登入。' });
          setToken(null);
        } else if (error.status === 404) {
          setFormMessage({ type: 'error', text: '找不到這項產品，請重新整理列表。' });
        } else {
          setFormMessage({ type: 'error', text: '儲存產品時發生錯誤，請稍後再試。' });
        }
      } else {
        setFormMessage({ type: 'error', text: '儲存產品時發生錯誤，請稍後再試。' });
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setProducts([]);
    resetForm();
    setLoginError(null);
    setProductsError(null);
    setFormMessage(null);
  };

  if (!token) {
    return (
      <section className="page">
        <h1>管理員登入</h1>
        <form className="form" onSubmit={handleLoginSubmit}>
          <label className="form-field">
            <span>帳號</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              disabled={isSubmitting}
              required
            />
          </label>
          <label className="form-field">
            <span>密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
          </label>
          {loginError ? <p className="form-error">{loginError}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登入中…' : '登入'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">產品管理後台</h1>
          <p className="page__subtitle">新增或編輯商品資訊，維護最新的商品清單。</p>
        </div>
        <div className="page__actions">
          <button type="button" className="button button--ghost" onClick={handleLogout}>
            登出
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <section className="admin-card">
          <h2 className="admin-card__title">{editingProductId ? '編輯產品' : '新增產品'}</h2>
          <form className="admin-form" onSubmit={handleProductSubmit}>
            <label className="form-field">
              <span>產品名稱</span>
              <input
                type="text"
                value={formState.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                required
                disabled={isSavingProduct}
              />
            </label>
            <label className="form-field">
              <span>產品描述</span>
              <textarea
                value={formState.description}
                onChange={(event) => handleInputChange('description', event.target.value)}
                disabled={isSavingProduct}
                rows={4}
              />
            </label>
            <div className="admin-form__row">
              <label className="form-field">
                <span>價格 (NT$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) => handleInputChange('price', event.target.value)}
                  required
                  disabled={isSavingProduct}
                />
              </label>
              <label className="form-field">
                <span>庫存數量</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formState.stock}
                  onChange={(event) => handleInputChange('stock', event.target.value)}
                  disabled={isSavingProduct}
                />
              </label>
            </div>
            <label className="form-field">
              <span>商品圖片</span>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSavingProduct}
              />
            </label>
            {formMessage ? (
              <p
                className={`alert ${
                  formMessage.type === 'error' ? 'alert--error' : 'alert--success'
                }`}
              >
                {formMessage.text}
              </p>
            ) : null}
            <div className="admin-form__actions">
              {editingProductId ? (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleCancelEdit}
                  disabled={isSavingProduct}
                >
                  取消編輯
                </button>
              ) : null}
              <button type="submit" className="button button--primary" disabled={isSavingProduct}>
                {isSavingProduct ? '儲存中…' : editingProductId ? '更新產品' : '新增產品'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-card">
          <h2 className="admin-card__title">現有產品</h2>
          {productsError ? <p className="alert alert--error">{productsError}</p> : null}
          {isLoadingProducts ? <p>載入中…</p> : null}
          {!isLoadingProducts && products.length === 0 && !productsError ? (
            <div className="admin-empty-state">
              <p>目前尚未新增任何產品。</p>
              <p>建立第一個產品後即可在此處看到清單。</p>
            </div>
          ) : null}
          <ul className="admin-product-list">
            {products.map((product) => (
              <li key={product.id} className="admin-product-item">
                <div className="admin-product-item__info">
                  <span className="admin-product-item__name">{product.name}</span>
                  <span className="admin-product-item__price">NT$ {product.price.toLocaleString()}</span>
                  {product.stock !== undefined ? (
                    <span className="admin-product-item__stock">庫存：{product.stock}</span>
                  ) : null}
                  {product.description ? (
                    <p className="admin-product-item__description">{product.description}</p>
                  ) : null}
                </div>
                <div className="admin-product-item__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => handleEditProduct(product)}
                    disabled={isSavingProduct}
                  >
                    編輯
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
};

export default AdminPage;
