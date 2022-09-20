import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Profile } from "../../reducers/profile";
import { db } from "../../utils/firebase";
import { Link, useNavigate, useParams } from "react-router-dom";
import notyetLike from "./NotLike.png";
import alreadyLike from "./AlreadyLike.png";
import comment from "./chat.png";
import { AllPetDiariesType } from "./AllPetDiraies";
import { CommentType } from "../Articles/ArticleDetail";
import { Btn } from "../ProfileSetting/UserInfos";

const Wrap = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #fafafa;
  position: relative;
  padding-top: 120px;
  padding-bottom: 120px;
  @media (max-width: 1120px) {
    padding-left: 50px;
    padding-right: 50px;
  }
  @media (max-width: 514px) {
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const DiaryContainer = styled.div`
  display: flex;
  max-width: 1120px;
  margin: 0 auto;
  position: relative;
  /* top: 120px; */
  border: solid 1px #dbdbdb;
  border-radius: 10px;
  overflow: hidden;
  font-size: 16px;
  @media (max-width: 889px) {
    flex-direction: column;
  }
`;

const DiaryImage = styled.img`
  width: 500px;
  height: 500px;
  object-fit: cover;
  @media (max-width: 1060px) {
    width: 400px;
  }
  @media (max-width: 889px) {
    width: 100%;
    height: 400px;
  }
  @media (max-width: 558px) {
    height: 300px;
  }
`;

const DiaryTextInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: #fff;
  @media (max-width: 889px) {
    padding-bottom: 20px;
  }
`;

const DiaryAuthorContainer = styled(Link)`
  display: flex;
  border-bottom: 1px solid #efefef;
  padding: 10px 15px;
  position: relative;
`;

const DiaryAuthorContainerNoBorder = styled(Link)`
  display: flex;
  padding: 10px 15px 0 0;
  position: relative;
`;

const AuthorImg = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
`;
const AuthorName = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #3c3c3c;
`;
const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  height: 300px;
  overflow-y: scroll;
  padding: 0 15px 0 15px;
`;

const DiaryContext = styled.div`
  font-size: 16px;
  margin-left: 55px;
  margin-bottom: 16px;
`;
const TimeContainer = styled.div`
  display: flex;
  margin-left: 55px;
  font-size: 16px;
  color: #7d7d7d;
`;

const PostTime = styled.div``;
const TakeptTime = styled.div`
  margin-left: 20px;
`;

const CommentTitle = styled.div``;

const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  padding-bottom: 30px;
  border-bottom: 1px solid #efefef;
  word-break: break-all;
`;

const CommentCard = styled.div`
  position: relative;
  margin-top: 25px;
`;
const RecordContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  left: 15px;
  padding-top: 15px;
  padding-bottom: 15px;
`;
const RecordImg = styled.img`
  width: 25px;
  height: 25px;
`;
const Record = styled.div`
  margin-right: 15px;
  margin-left: 5px;
  font-size: 16px;
  position: relative;
  bottom: 3px;
`;

const CommentUserContainer = styled.div`
  display: flex;
  align-items: center;
`;
const CommentUserImg = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
`;
const CommentUserName = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 15px;
  font-weight: bold;
`;
const CommentTime = styled.div`
  position: absolute;
  right: 5px;
  top: 5px;
  @media (max-width: 889px) {
    top: 13px;
  }
  @media (max-width: 409px) {
    top: auto;
    bottom: -22px;
    color: #7d7d7d;
  }
`;
const CommentContext = styled.div`
  margin-left: 55px;
  padding-right: 10px;
  line-height: 20px;
  @media (max-width: 478px) {
    margin-left: 0px;
    margin-top: 10px;
  }
`;
const AddComment = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 15px 0 15px;
`;
const AddCommentTextArea = styled.textarea`
  resize: vertical;
  min-height: 60px;
  max-height: 80px;
  width: 100%;
  border: 3px solid #efefef;
  border-radius: 5px;
  padding: 10px 15px;
  font-size: 18px;
`;
const AddCommentBtn = styled(Btn)`
  bottom: 95px;
  right: 20px;
  padding: 5px 10px;
  @media (max-width: 889px) {
    bottom: 100px;
  }
`;

const DiaryDetail = () => {
  const profile = useSelector<{ profile: Profile }>(
    (state) => state.profile
  ) as Profile;
  const { id } = useParams();
  const navigate = useNavigate();
  const [targetDiary, setTargetDiary] = useState<AllPetDiariesType>();
  const [diaryComments, setDiaryComments] = useState<CommentType[]>([]);
  const [newCommentContext, setNewCommentContext] = useState<string>();

  async function addDiaryComment() {
    if (!targetDiary) return;
    if (!newCommentContext) {
      window.alert("留言內容不能為空白！");
      return;
    }
    await addDoc(collection(db, `petDiaries/${targetDiary.id}/comments`), {
      user: {
        name: profile.name,
        img: profile.img,
      },
      useruid: profile.uid,
      context: newCommentContext,
      commentTime: Date.now(),
    });
    const articlesRef = doc(db, "petDiaries", targetDiary.id);
    await updateDoc(articlesRef, {
      commentCount: targetDiary.commentCount + 1,
    });
    setNewCommentContext("");
    window.alert("留言成功");
    getDiaryComments();
    getSpecificDiary();
  }

  async function getDiaryComments() {
    if (!targetDiary) return;
    const diaryComments: CommentType[] = [];
    const diariesRef = collection(db, `petDiaries/${targetDiary.id}/comments`);
    let diariesSnapshot = await getDocs(
      query(diariesRef, orderBy("commentTime"))
    );
    diariesSnapshot.forEach((info) => {
      diaryComments.push(info.data() as CommentType);
    });

    setDiaryComments(diaryComments);
  }

  async function getSpecificDiary() {
    const docRef = doc(db, "petDiaries", id as string);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setTargetDiary({
        id: docSnap.id,
        ...docSnap.data(),
      } as AllPetDiariesType);
    } else {
      console.log("No such document!");
    }
  }

  async function toggleLike() {
    if (!targetDiary) return;
    if (!profile.isLogged) {
      window.alert("按讚需先登入，確認後導向登入頁面");
      navigate("/profile");
      return;
    }
    const articleDetailRef = doc(db, "petDiaries", id as string);
    if (targetDiary.likedBy.includes(profile.uid)) {
      await updateDoc(articleDetailRef, {
        likedBy: arrayRemove(profile.uid),
      });
      const index = targetDiary.likedBy.indexOf(profile.uid);
      if (index > -1) {
        targetDiary.likedBy.splice(index, 1);
        setTargetDiary({
          ...targetDiary,
          likedBy: targetDiary.likedBy,
        });
      }
    } else {
      await updateDoc(articleDetailRef, {
        likedBy: arrayUnion(profile.uid),
      });
      targetDiary.likedBy.push(profile.uid);
      setTargetDiary({
        ...targetDiary,
        likedBy: targetDiary.likedBy,
      });
    }
  }

  useEffect(() => {
    getSpecificDiary();
  }, []);

  useEffect(() => {
    getDiaryComments();
  }, [targetDiary]);

  if (!targetDiary) return null;
  return (
    <Wrap>
      <DiaryContainer>
        <DiaryImage src={targetDiary.img} />
        <DiaryTextInfo>
          <DiaryAuthorContainer to={`/profile/${targetDiary.authorUid}`}>
            <AuthorImg src={targetDiary.author.img} />
            <AuthorName>
              {targetDiary.author.name}/ {targetDiary.petName}(
              {`${new Date().getFullYear() - targetDiary.birthYear}`}y)
            </AuthorName>
          </DiaryAuthorContainer>
          <MainSection>
            <DiaryAuthorContainerNoBorder
              to={`/profile/${targetDiary.authorUid}`}
            >
              <AuthorImg src={targetDiary.author.img} />
              <AuthorName>{targetDiary.author.name}</AuthorName>
            </DiaryAuthorContainerNoBorder>
            <DiaryContext>{targetDiary.context}</DiaryContext>
            <TimeContainer>
              <PostTime>
                發布於 {new Date(targetDiary.postTime).getFullYear()}/
                {new Date(targetDiary.postTime).getMonth() + 1}/
                {new Date(targetDiary.postTime).getDate()}
              </PostTime>
              <TakeptTime>
                拍攝於 {new Date(targetDiary.takePhotoTime).getFullYear()}/
                {new Date(targetDiary.takePhotoTime).getMonth() + 1}/
                {new Date(targetDiary.takePhotoTime).getDate()}
              </TakeptTime>
            </TimeContainer>
            <CommentContainer>
              <CommentTitle>留言區</CommentTitle>
              {diaryComments.map((comment, index) => (
                <CommentCard key={index}>
                  <CommentUserContainer>
                    <CommentUserImg src={comment.user.img} />
                    <CommentUserName>{comment.user.name}</CommentUserName>
                  </CommentUserContainer>
                  <CommentTime>
                    {new Date(comment.commentTime).getFullYear()}/
                    {new Date(comment.commentTime).getMonth() + 1}/
                    {new Date(comment.commentTime).getDate()}{" "}
                    {new Date(comment.commentTime).getHours()}:
                    {new Date(comment.commentTime).getMinutes()}
                  </CommentTime>
                  <CommentContext>{comment.context}</CommentContext>
                </CommentCard>
              ))}
            </CommentContainer>
          </MainSection>
          <RecordContainer>
            {targetDiary.likedBy.includes(profile.uid) ? (
              <>
                <RecordImg
                  src={alreadyLike}
                  onClick={() => {
                    toggleLike();
                  }}
                />
                <Record>{targetDiary.likedBy.length}</Record>
              </>
            ) : (
              <>
                <RecordImg
                  src={notyetLike}
                  onClick={() => {
                    toggleLike();
                  }}
                />
                <Record>{targetDiary.likedBy.length}</Record>
              </>
            )}
            <RecordImg src={comment} />
            <Record>{targetDiary.commentCount}</Record>
          </RecordContainer>
          <AddComment>
            <AddCommentTextArea
              value={newCommentContext}
              placeholder="新增留言 ..."
              onChange={(e) => {
                setNewCommentContext(e.target.value);
              }}
            ></AddCommentTextArea>
            <AddCommentBtn
              onClick={() => {
                if (!profile.isLogged) {
                  window.alert("留言需先登入，確認後導向登入頁面");
                  navigate("/profile");
                  return;
                }
                addDiaryComment();
              }}
            >
              新增留言
            </AddCommentBtn>
          </AddComment>
        </DiaryTextInfo>
      </DiaryContainer>
    </Wrap>
  );
};

export default DiaryDetail;
