interface RigaLogoProps {
    size?: number | string
    className?: string
}

export default function RigaLogo({ size = 32, className = '' }: RigaLogoProps) {
    return (
        <img
            src="/riga-logo.png"
            alt="Rīgas pašvaldība"
            style={{
                width: size,
                height: 'auto',
                // Invert filters to make black logo white on dark background
                filter: 'invert(1) brightness(100%)',
                opacity: 0.9
            }}
            className={className}
        />
    )
}
