import React, { useState, useEffect } from 'react';
import "./style.css";

const BannerCard = ({ item }) => {
    const elementMap = Object.fromEntries(
        item?.elements?.map(element => [element.key, element]) || []
    );

    const textElements = [
        {
            key: 'title',
            className: 'm-fs black-fw',
            maxLength: 25
        },
        {
            key: 'highlight',
            className: 'my-2 xxl-fs bold-fw',
            maxLength: 30,
            style: { lineHeight: 1 }
        },
        {
            key: 'content',
            className: 'm-fs normal-fw',
            maxLength: 60,
            style: { width: '100%' }
        }
    ];

    return (
        <div className='banner-card' style={{ background: elementMap.background?.gradient || elementMap.background?.color }}>
            <div className='content-area ps-3'>
                {textElements.map(config => {
                    const element = elementMap[config.key];
                    if (!element?.text) return null;

                    const displayText = element.text.length > config.maxLength
                        ? `${element.text.slice(0, config.maxLength)}...`
                        : element.text;

                    return (
                        <p
                            key={config.key}
                            className={config.className}
                            style={{ color: element.color, ...config.style }}
                        >
                            {displayText}
                        </p>
                    );
                })}
            </div>
            {elementMap.image?.image && (
                <div className=''>
                    <img
                        className='banner-img'
                        src={elementMap.image.image}
                        alt="banner"
                    />
                </div>
            )}
        </div>
    );
};

const Banners = ({ data }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);

    useEffect(() => {
        if (!data?.length) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % data.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [data?.length]);

    const handleTouch = {
        onTouchStart: (e) => setTouchStart(e.touches[0].clientX),
        onTouchMove: (e) => {
            if (!touchStart) return;

            const diff = touchStart - e.touches[0].clientX;
            if (Math.abs(diff) > 50) {
                setCurrentIndex(prev =>
                    diff > 0
                        ? (prev + 1) % data.length
                        : (prev - 1 + data.length) % data.length
                );
                setTouchStart(null);
            }
        },
        onTouchEnd: () => setTouchStart(null)
    };

    if (!data?.length) return null;

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    transition: 'transform 0.5s ease',
                    transform: `translateX(-${currentIndex * 100}%)`,
                }}
                {...handleTouch}
            >
                {data.map((item, index) => (
                    <div
                        key={index}
                        className='d-flex align-items-center justify-content-between bg-white'
                        style={{
                            minWidth: '100%',
                            boxSizing: 'border-box',
                            padding: '10px',
                            height: 175,
                            borderRadius: 12
                        }}
                    >
                        <BannerCard item={item} />
                    </div>
                ))}
            </div>
            <div className='my-1' style={{ textAlign: 'center' }}>
                {data.map((_, index) => (
                    <span
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            margin: '0 5px',
                            borderRadius: '50%',
                            backgroundColor: currentIndex === index ? '#000' : '#ccc',
                            cursor: 'pointer',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Banners;