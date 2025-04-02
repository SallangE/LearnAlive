import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
// :흰색_확인_표시: AuthContext 생성
export const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // :흰색_확인_표시: 페이지 로드 시 세션스토리지에 저장된 사용자 정보를 가져오기
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  // :흰색_확인_표시: 로그인 함수
  const login = async (userId, password) => {
    try {
      console.log(":압정: 로그인 요청:", { userId, password });
      const response = await axios.post("http://localhost:8080/api/auth/login", {
        userId,
        password,
      });
      const userData = response.data;
      // :흰색_확인_표시: 응답 확인
      console.log(":포장: userData:", userData);
      console.log(":포장: token:", userData.token);
      // :흰색_확인_표시: 토큰 로컬스토리지에 저장
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }
      // :흰색_확인_표시: 사용자 정보 세션스토리지에 저장
      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
      console.log(":흰색_확인_표시: 로그인 성공!");
    } catch (error) {
      console.error(":압정: 로그인 실패:", error.response?.data || error.message);
      alert(error.response?.data?.message || "로그인 실패. 아이디와 비밀번호를 확인하세요.");
    }
  };
  // :흰색_확인_표시: 로그아웃 함수
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    localStorage.removeItem("token"); // :왼쪽을_가리키는_손_모양: 토큰도 삭제!
    console.log(":흰색_확인_표시: 로그아웃 완료");
  };
  // :흰색_확인_표시: Provider에서 제공할 값들
  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
// :흰색_확인_표시: useAuth 훅 제공
export const useAuth = () => useContext(AuthContext);
export default AuthProvider;