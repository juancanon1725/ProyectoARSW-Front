import React, { useEffect } from 'react';
import breakout from './breakout'; // Ajusta la ruta según sea necesario

const BreakBreaker = () => {
    useEffect(() => {
        breakout(); // Inicializar el juego cuando el componente se monta
    }, []);

    return (
        <div>
            <canvas id="board"></canvas>
        </div>
    );
};

export default BreakBreaker;


