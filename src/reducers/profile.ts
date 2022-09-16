export enum ActionType {
  setProfileName = "setProfileName",
  setProfileEmail = "setProfileEmail",
  setProfilePassword = "setProfilePassword",
  setProfileImage = "setProfileImage",
  clearProfileInfo = "clearProfileInfo",
  checkIfLogged = "checkIfLogged",
  setProfileUid = "setProfileUid",
  clickLoginOrRegister = "clickLoginOrRegister",
  afterRegisterSaveName = "afterRegisterSaveName",
  setOwnPets = "setOwnPets",
  setOwnPetDiary = "setOwnPetDiary",
  setOwnArticle = "setOwnArticle",
}

interface setProfileName {
  type: ActionType.setProfileName;
  payload: { name: string };
}

interface setProfileEmail {
  type: ActionType.setProfileEmail;
  payload: { email: string };
}

interface setProfilePassword {
  type: ActionType.setProfilePassword;
  payload: { password: string };
}

interface setProfileImage {
  type: ActionType.setProfileImage;
  payload: { img: File | string };
}

interface clearProfileInfo {
  type: ActionType.clearProfileInfo;
}

interface checkIsLogged {
  type: ActionType.checkIfLogged;
  payload: { isLogged: boolean };
}

interface setProfileUid {
  type: ActionType.setProfileUid;
  payload: { uid: string };
}

interface clickLoginOrRegister {
  type: ActionType.clickLoginOrRegister;
  payload: { target: string };
}

interface afterRegisterSaveName {
  type: ActionType.afterRegisterSaveName;
}

interface setOwnPets {
  type: ActionType.setOwnPets;
  payload: { ownPets: OwnPet[] };
}

interface setOwnPetDiary {
  type: ActionType.setOwnPetDiary;
  payload: { petDiary: PetDiaryType[] };
}

interface setOwnArticle {
  type: ActionType.setOwnArticle;
  payload: { ownArticles: OwnArticle[] };
}

export type ProfileActions =
  | setProfileName
  | setProfileEmail
  | setProfilePassword
  | setProfileImage
  | clearProfileInfo
  | checkIsLogged
  | setProfileUid
  | clickLoginOrRegister
  | afterRegisterSaveName
  | setOwnPets
  | setOwnPetDiary
  | setOwnArticle;

export type OwnPet = {
  name: string;
  img: string;
  birthYear: number;
  kind: string;
  sex: string;
  shelterName: string | boolean;
};

export type OwnArticle = {
  title: string;
  context: string;
  authorUid: string;
  postTime: number;
  likedBy: string[];
  img: string;
  commentCount: number;
  author: {
    name: string;
    img: string;
  };
  id: string;
};

export type PetDiaryType = {
  petName: string;
  takePhotoTime: number;
  context: string;
  author: {
    name: string;
    img: string;
  };
  commentCount: number;
  likedBy: string[];
  img: string;
  postTime: number;
  authorUid: string;
  id: string;
  birthYear: number;
};

export type Profile = {
  name: string;
  password: string;
  email: string;
  img: string | File;
  isLogged: boolean;
  clickLoginOrRegister: string;
  uid: string;
  ownPets: OwnPet[];
  petDiary: PetDiaryType[];
  ownArticles: OwnArticle[];
};

const initialState: Profile = {
  name: "",
  password: "",
  email: "",
  img: "",
  isLogged: false,
  clickLoginOrRegister: "",
  uid: "",
  ownPets: [],
  petDiary: [],
  ownArticles: [],
};

const ProfileReducer = (
  state: Profile = initialState,
  action: ProfileActions
) => {
  switch (action.type) {
    case ActionType.setProfileName: {
      return { ...state, name: action.payload.name };
    }
    case ActionType.setProfileEmail: {
      return { ...state, email: action.payload.email };
    }
    case ActionType.setProfilePassword: {
      return { ...state, password: action.payload.password };
    }
    case ActionType.setProfileImage: {
      return { ...state, img: action.payload.img };
    }
    case ActionType.checkIfLogged: {
      return { ...state, isLogged: action.payload.isLogged };
    }
    case ActionType.clearProfileInfo: {
      return { ...state, name: "", password: "", email: "", img: "" };
    }
    case ActionType.afterRegisterSaveName: {
      return {
        ...state,
        password: "",
        email: "",
      };
    }
    case ActionType.setProfileUid: {
      return { ...state, uid: action.payload.uid };
    }
    case ActionType.clickLoginOrRegister: {
      return { ...state, clickLoginOrRegister: action.payload.target };
    }
    case ActionType.setOwnPets: {
      return { ...state, ownPets: action.payload.ownPets };
    }
    case ActionType.setOwnPetDiary: {
      return { ...state, petDiary: action.payload.petDiary };
    }
    case ActionType.setOwnArticle: {
      return { ...state, ownArticles: action.payload.ownArticles };
    }
    default:
      return state;
  }
};

export default ProfileReducer;
