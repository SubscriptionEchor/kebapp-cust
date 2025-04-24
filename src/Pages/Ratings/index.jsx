import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import Lottie from 'lottie-react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { reviewOrder } from '../../apollo/server';
import animationData from '../../assets/Lottie/confettiNew.json';
import imgRat from "../../assets/PNG/rat-image.png";
import { useTranslation } from 'react-i18next';
import './style.css';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { showErrorToast, showSuccessToast } from '../../Components/Toast';

const REVIEW_ORDER = gql`${reviewOrder}`;

const Ratings = () => {
    let orderDetails = localStorage.getItem(LOCALSTORAGE_NAME.RATING_ID);
    orderDetails = JSON.parse(orderDetails);
    const { t } = useTranslation();
    const [submitted, setSubmitted] = useState(false);
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');
    const [reviewOrderMutation, { loading, error }] = useMutation(REVIEW_ORDER);
    const navigate = useNavigate();

    const handleStarClick = (index) => setRating(index + 1);

    const handleSubmit = async () => {
        if (!rating || rating == 0) return showErrorToast("Please select a rating");

        try {
            const result = await reviewOrderMutation({
                variables: {
                    order: orderDetails?.orderId,
                    rating: rating,
                    description: description || null
                }
            });
            if (result.data) {
                setSubmitted(true);
            }
        } catch (err) {
            console.error('Error submitting review:', err);
        }
    };

    const renderStars = () => (
        <div className="my-3">
            {[...Array(5)].map((_, i) => (
                <FaStar
                    key={i}
                    className={`${i < rating ? "text-warning" : "text-secondary"} ${i !== 0 ? "ms-3" : ""}`}
                    onClick={() => handleStarClick(i)}
                    style={{ cursor: 'pointer', fontSize: '30px' }}
                />
            ))}
        </div>
    );

    const handleBack = () => {
        if (window.handleCustomBack) {
            window.handleCustomBack();
        }
    };

    return (
        <div className="position-relative main-div">
            <div className="container d-flex justify-content-center align-items-center main_container">
                {!submitted ? (
                    <div className="card border-0 text-start p-0 w-100 share-review-main-div">
                        <div className="card-body p-0 d-flex flex-column" style={{ flexGrow: 1 }}>
                            <img src={imgRat} alt="Icon" className="rounded-circle my-3 border img-ratings" />
                            <h5 className="card-title fw-bold fs-2">{t('ratings.howWas')}, {orderDetails?.restaurantName || ""}?</h5>
                            {renderStars()}
                            <p className="card-text mb-3 fw-bold">{t('ratings.thanksForReview')}</p>
                            <textarea
                                className="form-control mb-3 custom-textarea"
                                placeholder={t('ratings.whatDidYouLike')}
                                rows="6"
                                maxLength={500}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ borderRadius: '8px', backgroundColor: "#F1F5F9" }}
                            />
                        </div>
                        <button
                            className="btn btn-success btn-block w-100 btn-color btn-shareReview l-fs fw-bold"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner-border text-light spnr" role="status" >
                                    <span className="visually-hidden">{t('ratings.loading')}</span>
                                </div>
                            ) : t('ratings.shareReview')}
                        </button>
                    </div>
                ) : (
                    <div className="card border-0 text-center bg-transparent back-to-home-mainDiv">
                        {/* Render the Lottie animation here */}
                        <Lottie
                            animationData={animationData}
                            loop={true}
                            autoplay={true}
                            style={{
                                position: 'absolute',
                                top: '0%',
                                left: '10%',
                                // width: '200px',
                                // height: '200px',
                                zIndex: 100,
                                pointerEvents: 'none',
                            }}
                        />
                        <div className="card-body p-0 content-div">
                            <div className='px-4 mx-0 mt-5 rounded-4 py-4 mb-5'>
                                <img src={imgRat} alt="Icon" className="rounded-circle my-3 border img-ratings" />
                                <p className='fw-light mb-2'>{orderDetails?.restaurantName || ""} {t('ratings.says')}</p>
                                <h5 className="card-title fw-bold fs-4 mb-3 mt-2">{t('ratings.thankYouFeedback')}</h5>
                                <p className="card-text fw-light mb-2">
                                    {t('ratings.appreciateSupport')}
                                </p>
                            </div>
                        </div>
                        <button
                            className="btn btn-success btn-block w-100 btn-color back-to-home-btn l-fs fw-bold"
                            onClick={handleBack}
                        >
                            {t('ratings.backToHome')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ratings;
