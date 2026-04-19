import {logOut} from "../firebase"
import { Navigate, useNavigate } from "react-router-dom"



export default function Home(){
    const navigate = useNavigate();

    const handleLogOut = async() => {
            await logOut();
            navigate("/");
        };

    const goToActivities = () => {
        navigate("/activities");
    };

    const goToCommunity = () => {
        navigate("/community");
    };

    const goToSettings = () => {
        navigate("/settingsandpreferences");
    };

    return(
        <div>
            <h1>HOME</h1>

            <button type="button" onClick={handleLogOut}>LOG OUT</button>
            <button type="button" onClick={goToActivities}>ACTIVITIES</button>
            <button type="button" onClick={goToCommunity}>COMMUNITY</button>
            <button type="button" onClick={goToSettings}>Settings and Preferences</button>

        </div>
    );
}