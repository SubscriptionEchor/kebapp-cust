import React, { useEffect, useState } from 'react'
const MobileOnlyApp = ({ children }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    if (!isMobile) {
        return (
            <div style={styles.restricted}>
                <h1>Mobile devices only. Please use a mobile device.</h1>
            </div>
        )
    }

    return children
}

const styles = {
    restricted: {
        textAlign: 'center',
        marginTop: '50px',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
    },
}

export default MobileOnlyApp
