import React, { useRef, useState, useEffect, useContext } from 'react';
import { routeName } from '../../Router/RouteName';
import Close from "../../assets/svg/close.svg";
import UserContext from '../../Context/User';
import { useNavigate } from 'react-router-dom';
import { Context } from '../../Context/Context';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { useTranslation } from 'react-i18next';

const CartCarousel = ({ cart }) => {
    const { t } = useTranslation();
    const { deleteRestaurantFromCart } = useContext(UserContext)
    const ref = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [startX, setStartX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();


    // Group items by restaurantId
    let groupedItems = cart.reduce((acc, item) => {
        if (!acc[item.restaurantId]) {
            acc[item.restaurantId] = [];
        }
        acc[item.restaurantId].push(item);
        return acc;
    }, {});
    groupedItems = Object.values(groupedItems);

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setCurrentIndex((prevIndex) => {
    //             return (prevIndex + 1) % groupedItems.length;
    //         });
    //     }, 3000); // Change slide every 3 seconds

    //     return () => clearInterval(interval); // Cleanup on unmount
    // }, [groupedItems.length]);

    const handleDotClick = (index) => {
        setCurrentIndex(index);
    };

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diffX = startX - currentX;

        // If the swipe is significant enough, change the index
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swiped left
                setCurrentIndex((prevIndex) => (prevIndex + 1) % groupedItems.length);
            } else {
                // Swiped right
                setCurrentIndex((prevIndex) => (prevIndex - 1 + groupedItems.length) % groupedItems.length);
            }
            setIsDragging(false); // Reset dragging state
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleNavigate = (id) => {
        localStorage.setItem(LOCALSTORAGE_NAME.CHECKOUT_ID, id)
        navigate(routeName.CHECKOUT, {
            state: {
                id: id,
            }
        });
    };

    return (
        <div className='rounded-4 bg-light' style={{ margin: '20px', overflow: 'hidden', position: "sticky", bottom: "9%", zIndex: 100, boxShadow: '0px 16px 24px rgba(0, 0, 0, 0.3)' }}>
            <div
                style={{
                    display: 'flex',
                    transition: 'transform 0.5s ease',
                    transform: `translateX(-${currentIndex * 100}%)`,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {groupedItems.map((group, index) => (
                    <div key={index} className='d-flex align-items-center justify-content-between bg-white' style={{ minWidth: '100%', boxSizing: 'border-box', padding: '10px' }}>
                        <div className='mt-1 ps-1' style={{ width: "55%" }}>
                            <p className='semiBold-fw xl-fs text-ellipsis' style={{ width: "100%" }}>{group[0]?.restaurantName}</p>
                            <p>{group.reduce((acc, item) => acc + item?.quantity, 0)} {t('caurosel.items')}</p>
                        </div>
                        <div className='d-flex align-items-center'>
                            <button className='secondary-bgcolor border-0 rounded-3 p-2' onClick={() =>
                                handleNavigate(group[0]?.restaurantId)}>
                                <p className='semiBold-fw xl-fs'>{t('caurosel.viewCart')}</p>
                            </button>
                            <div onClick={() => deleteRestaurantFromCart(group[0]?.restaurantId)} className='ms-2 secondary-bgcolor  d-flex align-items-center justify-content-center rounded-5' style={{ width: 30, height: 30 }}>
                                <img src={Close} height={15} />
                            </div>
                            {/* <button className='bg-light ms-3 border-0 rounded-3 p-2' onClick={() => navigate(routeName?.CHECKOUT, { state: { id: group[0]?.restaurantId } })}>Remove</button> */}
                        </div>
                    </div>
                ))}
            </div>
            <div className='my-1' style={{ textAlign: 'center' }}>
                {groupedItems.map((_, index) => (
                    <span
                        key={index}
                        onClick={() => handleDotClick(index)}
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            margin: '0 4px',
                            borderRadius: '50%',
                            backgroundColor: currentIndex === index ? '#EDCC27' : '#ccc',
                            cursor: 'pointer',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default CartCarousel;