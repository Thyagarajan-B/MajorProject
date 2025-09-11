import  { useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AppContext } from "../context/AppContext"

const AuthCallback = () => {
  const navigate = useNavigate()
  const { setToken } = useContext(AppContext)

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const token = queryParams.get("token")

    if (token) {
      localStorage.setItem("token", token)
      setToken(token)
      navigate("/") // redirect to homepage/dashboard
    } else {
      navigate("/login")
    }
  }, [navigate, setToken])

  return <p>Logging you in with Google...</p>
}

export default AuthCallback
