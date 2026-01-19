import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { CartContext } from '../context/CartContext';

const mockProduct = {
  _id: '123',
  name: 'Wireless Headphones',
  description: 'Premium wireless headphones with noise cancellation',
  price: 199.99,
  comparePrice: 249.99,
  images: ['https://example.com/headphones.jpg'],
  category: {
    _id: 'cat1',
    name: 'Electronics',
  },
  stock: 50,
  rating: 4.5,
  reviews: 120,
  isFeatured: true,
};

const renderWithProviders = (component, cartValue = {}) => {
  const defaultCartValue = {
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <CartContext.Provider value={{ ...defaultCartValue, ...cartValue }}>
        {component}
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product information', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.name)).toBeDefined();
    expect(screen.getByText(`$${mockProduct.price}`)).toBeDefined();
  });

  it('should display product image', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const image = screen.getByRole('img', { name: mockProduct.name });
    expect(image).toBeDefined();
    expect(image.src).toContain(mockProduct.images[0]);
  });

  it('should show discount percentage when comparePrice exists', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const discount = ((mockProduct.comparePrice - mockProduct.price) / mockProduct.comparePrice * 100).toFixed(0);
    expect(screen.getByText(`${discount}% OFF`)).toBeDefined();
  });

  it('should display strike-through compare price', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const comparePrice = screen.getByText(`$${mockProduct.comparePrice}`);
    expect(comparePrice).toBeDefined();
    expect(comparePrice.classList.contains('line-through')).toBe(true);
  });

  it('should show product rating', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.rating.toString())).toBeDefined();
  });

  it('should show number of reviews', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText(`(${mockProduct.reviews})`)).toBeDefined();
  });

  it('should show featured badge when product is featured', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/featured/i)).toBeDefined();
  });

  it('should not show featured badge when product is not featured', () => {
    const nonFeaturedProduct = { ...mockProduct, isFeatured: false };
    renderWithProviders(<ProductCard product={nonFeaturedProduct} />);

    expect(screen.queryByText(/featured/i)).toBeNull();
  });

  it('should show out of stock message when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderWithProviders(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText(/out of stock/i)).toBeDefined();
  });

  it('should show low stock warning when stock is less than 5', () => {
    const lowStockProduct = { ...mockProduct, stock: 3 };
    renderWithProviders(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText(/only 3 left/i)).toBeDefined();
  });

  it('should call addToCart when add to cart button is clicked', () => {
    const mockAddToCart = vi.fn();
    renderWithProviders(<ProductCard product={mockProduct} />, {
      addToCart: mockAddToCart,
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should disable add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderWithProviders(<ProductCard product={outOfStockProduct} />);

    const addButton = screen.getByRole('button', { name: /out of stock/i });
    expect(addButton.disabled).toBe(true);
  });

  it('should navigate to product detail page when clicked', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const productLink = screen.getByRole('link');
    expect(productLink.href).toContain(`/products/${mockProduct._id}`);
  });

  it('should show quick view button on hover', async () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const card = screen.getByRole('article');
    fireEvent.mouseEnter(card);

    const quickViewButton = await screen.findByRole('button', { name: /quick view/i });
    expect(quickViewButton).toBeDefined();
  });

  it('should show wishlist button', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByRole('button', { name: /wishlist/i });
    expect(wishlistButton).toBeDefined();
  });

  it('should handle missing image gracefully', () => {
    const productWithoutImage = { ...mockProduct, images: [] };
    renderWithProviders(<ProductCard product={productWithoutImage} />);

    const image = screen.getByRole('img');
    expect(image.src).toContain('placeholder');
  });

  it('should format price with currency symbol', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const priceElement = screen.getByText(`$${mockProduct.price}`);
    expect(priceElement).toBeDefined();
  });

  it('should show loading state when adding to cart', async () => {
    const mockAddToCart = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    renderWithProviders(<ProductCard product={mockProduct} />, {
      addToCart: mockAddToCart,
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/adding/i)).toBeDefined();
  });

  it('should show success message after adding to cart', async () => {
    const mockAddToCart = vi.fn(() => Promise.resolve());
    renderWithProviders(<ProductCard product={mockProduct} />, {
      addToCart: mockAddToCart,
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    await screen.findByText(/added to cart/i);
    expect(screen.getByText(/added to cart/i)).toBeDefined();
  });
});
