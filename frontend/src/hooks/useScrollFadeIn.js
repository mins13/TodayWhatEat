import { useEffect, useRef, useState } from 'react';

function useScrollFadeIn(direction = 'up', duration = 0.8) {
    const dom = useRef();
    const [isVisible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(dom.current); // 한 번만 실행되게
                }
            },
            { threshold: 0.1 }
        );

        if (dom.current) {
            observer.observe(dom.current);
        }

        return () => observer && observer.disconnect();
    }, []);

    const transformMap = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)',
    };

    return {
        ref: dom,
        style: {
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : transformMap[direction],
            transition: `all ${duration}s ease-out`,
        },
    };
}

export default useScrollFadeIn;
