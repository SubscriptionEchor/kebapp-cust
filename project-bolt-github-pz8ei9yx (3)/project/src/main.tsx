import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import App from './App';
import { CartProvider } from './context/CartContext';
import './i18n';
import './index.css';

// Update the title for the Telegram Mini App
document.title = 'Telegram Mini App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <CartProvider>
      <App />
      </CartProvider>
    </ApolloProvider>
  </StrictMode>
);