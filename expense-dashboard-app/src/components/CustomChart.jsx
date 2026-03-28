import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export const CustomChart = ({ config, height="250px" }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);
    
    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (canvasRef.current) {
            chartInstance.current = new Chart(canvasRef.current, config);
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [config]);
    
    return <div className="relative w-full" style={{height}}><canvas ref={canvasRef}></canvas></div>;
};
