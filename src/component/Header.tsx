import React from "react";
import logo from "./fluffylogo.png";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { setName, setImage } from "../functions/profileReducerFunction";

import {
  checkIfLogged,
  targetRegisterOrLogin,
  setProfileUid,
} from "../functions/profileReducerFunction";
import { Profile } from "../reducers/profile";

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NavBarContainer = styled.ul`
  display: flex;
  align-items: center;
  margin-right: auto;
  margin-left: 50px;
`;

const NavBar = styled.li`
  margin-right: 10px;
  cursor: pointer;
  &:hover {
    background-color: black;
    color: white;
  }
`;

const LoginRegisterBtnWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const LoginRegisterBtn = styled.div`
  cursor: pointer;
  &:hover {
    background-color: black;
    color: white;
  }
`;

const Header = () => {
  const profile = useSelector<{ profile: Profile }>(
    (state) => state.profile
  ) as Profile;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(setProfileUid(user.uid));
        dispatch(checkIfLogged(true));
        const docRef = doc(db, "memberProfiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          dispatch(setName(docSnap.data().name));
          dispatch(setImage(docSnap.data().img));
        } else {
          console.log("No such document!");
        }
      } else {
        dispatch(checkIfLogged(false));
      }
    });
  }, []);

  return (
    <Wrapper>
      <a href="/">
        <img src={logo} alt="" style={{ width: "150px" }} />
      </a>
      <NavBarContainer>
        <NavBar
          onClick={() => {
            if (!profile.isLogged) {
              window.alert(
                "使用此功能需先註冊或登入！點擊確認後前往註冊與登入頁面"
              );
              navigate("/profile");
            } else {
              navigate("/dating");
            }
          }}
        >
          配對專區
        </NavBar>
        <NavBar>寵物日記</NavBar>
        <NavBar>24 小時動物醫院</NavBar>
        <NavBar>寵物走失協尋</NavBar>
      </NavBarContainer>

      {profile.isLogged ? (
        <p onClick={() => navigate("/profile")}>{profile.name} 您好！</p>
      ) : (
        <LoginRegisterBtnWrapper>
          <LoginRegisterBtn
            onClick={() => {
              dispatch(targetRegisterOrLogin("register"));
              navigate("/profile");
            }}
          >
            註冊
          </LoginRegisterBtn>
          <LoginRegisterBtn
            onClick={() => {
              dispatch(targetRegisterOrLogin("login"));
              navigate("/profile");
            }}
          >
            登入
          </LoginRegisterBtn>
        </LoginRegisterBtnWrapper>
      )}
    </Wrapper>
  );
};

export default Header;
