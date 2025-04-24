import React from 'react';
import Lottie from 'lottie-react';

const LottieAnimation = ({ animationData, loop = true, autoplay = true, width = 200, height = 200 }) => {

    return (
        <div style={{ width, height }}>
            <Lottie loop={loop} autoPlay={autoplay} animationData={animationData} />
        </div>
    );
};

export default LottieAnimation;

/*
<LottieAnimation
    animationData={sampleAnimation}
    width={300}
    height={300}
    autoplay={true}
    loop={true}
/>*/