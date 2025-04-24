import { Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultOptions = {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: false,
    progress: undefined,
    theme: "light",
    transition: Slide,
    newestOnTop: false,
    limit: 5,
    rtl: false,
    pauseOnFocusLoss: false,
};

export const showSuccessToast = (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
};

export const showErrorToast = (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options });
};