// import { useState, useEffect, useCallback } from "react";
// import client from "../../appwrite.config";
// import { Databases, Query } from "appwrite";
// import { useSearchParams, useParams, useLocation, useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";
import { useState, useEffect, useCallback } from "react";
import client from "../../appwrite.config";
import { Databases, Teams, Query } from "appwrite";
import { useSearchParams, useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";


function GetAllJoinedEvents() {

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const {pathname} = useLocation();
    const [eventCount, setEventCount] = useState(null);
    const [ownedEvent, setOwnedEvent] = useState(null);
    const [privateEvent, setPrivateEvent] = useState(null);
    const [publicEvent, setPublicEvent] = useState(null);
    const [offlineEvent, setOfflineEvent] = useState(null);
    const [onlineEvent, setOnlineEvent] = useState(null);

    const filter = searchParams.get("filter");
    const userId = JSON.parse(localStorage.getItem('token')).userId; 

    const getTeams = useCallback(async () => {
        try {
            const teams = new Teams(client);
            const response = await teams.list(); 
            // toast.error(response.teams);
            return response.teams.map(team => team.$id);
        } catch (err) {
            setError(err.message);
            toast.error("Failed to fetch teams: " + err.message);
            return [];
        }
    }, []);

    
    const buildQuery = useCallback((teamIds) => {
        let queries = [Query.equal('teamId', teamIds)];

        switch (filter) {
            case 'owned':
                queries.push(Query.equal('createdBy', userId));
                break;
            case 'private':
                queries.push(Query.equal('privacy', 'private'));
                break;
            case 'public':
                queries.push(Query.equal('privacy', 'public'));
                break;
            case 'online':
                queries.push(Query.equal('medium', 'online'));
                break;
            case 'offline':
                queries.push(Query.equal('medium', 'offline'));
                break;
            default:
                break;
        }
        return queries;
    }, [filter, userId]);

    
    const getEvents = useCallback(async () => {
        
        try {
            setLoading(prev => true);
            const teamIds = await getTeams(); 
            if (teamIds.length === 0) return; 

            const database = new Databases(client);
            const queries = buildQuery(teamIds);

            const response = await database.listDocuments(
                process.env.REACT_APP_DATABASE_ID,
                process.env.REACT_APP_EVENTS_COLLECTION_ID,
                queries
            );

            setEvents(prev => response.documents);
            setEventCount(prev => response?.total);
            setOwnedEvent(prev => response?.documents?.filter(event => event.createdBy == userId))
            setPrivateEvent(prev => response?.documents?.filter(event => event.privacy === "private"))
            setPublicEvent(prev => response?.documents?.filter(event => event.privacy === "public"))
            setOfflineEvent(prev => response?.documents?.filter(event => event.medium === "offline"))
            setOnlineEvent(prev => response?.documents?.filter(event => event.medium === "online"))
        } 
        catch (err) {
            setError(err.message);
        } 
        finally {
            setLoading(prev => false);
        }
    }, [getTeams, buildQuery]);

    
    useEffect(() => {
        getEvents(); 
    }, [getEvents]);

    return {
        loading, error, events, eventCount, ownedEvent, privateEvent, publicEvent, offlineEvent, onlineEvent, filter, id, setSearchParams, searchParams, getEvents
    };
}

export default GetAllJoinedEvents