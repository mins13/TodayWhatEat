import React from 'react';
import './InfoCard.css';

function InfoCard({ text, imgSrc, reverse }) {
    return (
        <div className={`info-card ${reverse ? 'reverse' : ''}`}>
            <div className="text">{text}</div>
            <img src={imgSrc} alt="소개 이미지" />
        </div>
    );
}

export default InfoCard;
