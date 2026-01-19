import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/common/Header';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const renderWithProviders = (component, { authValue, cartValue } = {}) => {
  const defaultAuthValue = {
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  const defaultCartValue = {
    cart: [],
    cartCount: 0,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ ...defaultAuthValue, ...authValue }}>
        <CartContext.Provider value={{ ...defaultCartValue, ...cartValue }}>
          {component}
        </CartContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with logo', () => {
    renderWithProviders(<Header />);

    const logo = screen.getByRole('link', { name: /logo/i });
    expect(logo).toBeDefined();
  });

  it('should show login button when user is not authenticated', () => {
    renderWithProviders(<Header />);

    const loginButton = screen.getByRole('link', { name: /login/i });
    expect(loginButton).toBeDefined();
  });

  it('should show user menu when user is authenticated', () => {
    const mockUser = {
      _id: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    renderWithProviders(<Header />, {
      authValue: {
        user: mockUser,
        isAuthenticated: true,
      },
    });

    expect(screen.getByText(/john/i)).toBeDefined();
  });

  it('should display cart count', () => {
    renderWithProviders(<Header />, {
      cartValue: {
        cartCount: 3,
      },
    });

    const cartCount = screen.getByText('3');
    expect(cartCount).toBeDefined();
  });

  it('should call logout when logout button is clicked', async () => {
    const mockLogout = vi.fn();
    const mockUser = {
      _id: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    renderWithProviders(<Header />, {
      authValue: {
        user: mockUser,
        isAuthenticated: true,
        logout: mockLogout,
      },
    });

    // Open user menu
    const userMenu = screen.getByText(/john/i);
    fireEvent.click(userMenu);

    // Click logout
    await waitFor(() => {
      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should navigate to cart when cart icon is clicked', () => {
    renderWithProviders(<Header />);

    const cartLink = screen.getByRole('link', { name: /cart/i });
    expect(cartLink).toHaveProperty('href');
    expect(cartLink.href).toContain('/cart');
  });

  it('should show search bar', () => {
    renderWithProviders(<Header />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeDefined();
  });

  it('should handle search input', () => {
    renderWithProviders(<Header />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    expect(searchInput.value).toBe('laptop');
  });

  it('should show mobile menu button on small screens', () => {
    renderWithProviders(<Header />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeDefined();
  });

  it('should toggle mobile menu when menu button is clicked', async () => {
    renderWithProviders(<Header />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    // Menu should be visible
    await waitFor(() => {
      const mobileMenu = screen.getByRole('navigation', { name: /mobile/i });
      expect(mobileMenu).toBeDefined();
    });
  });

  it('should display navigation links', () => {
    renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: /home/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /products/i })).toBeDefined();
  });

  it('should highlight active navigation link', () => {
    renderWithProviders(<Header />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink.classList.contains('active')).toBe(true);
  });
});
