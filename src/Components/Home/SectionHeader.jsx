// components/Home/components/SectionHeader.jsx
import React, { memo } from 'react';

const SectionHeader = ({ title, leftLineImg, rightLineImg }) => {
    return (
        <div className='d-flex align-items-center justify-content-center pd-horizontal mb-3'>
            <img className='line' src={leftLineImg} alt="line" />
            <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>{title}</p>
            <img className='line' src={rightLineImg} alt="line" />
        </div>
    );
};

export default memo(SectionHeader);