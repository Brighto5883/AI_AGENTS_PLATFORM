import "../styling/Footer.css";

function Footer() {
    return (
        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} BRIGHTONE-AI-PLATFORM</p>
        </footer>
    );
}
export default Footer