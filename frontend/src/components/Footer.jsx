import "../styling/Footer.css";

function Footer() {
    return (
        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} KENYA-ROAD-DESIGN-AGENT</p>
        </footer>
    );
}
export default Footer