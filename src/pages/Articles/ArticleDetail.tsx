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
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Profile } from "../../reducers/profile";
import { db } from "../../utils/firebase";
import { useParams } from "react-router-dom";
import { AllPetArticlesType } from "./AllArticles";
import parse from "html-react-parser";
import "./ArticleDetail.css";
import notyetLike from "./like.png";
import alreadyLike from "./like (1).png";

const ArticleContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 30px auto;
`;
const ArticleCover = styled.img`
  width: 100%;
  height: 400px;
`;
const TitleContainer = styled.div`
  position: relative;
`;
const Title = styled.div`
  font-size: 30px;
  font-weight: bold;
`;
const Author = styled(Link)`
  font-size: 22px;
`;
const ArticleDate = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
`;
const ArticleContext = styled.div``;
const RecordContainer = styled.div`
  display: flex;
  align-items: center;
`;
const Record = styled.div`
  font-size: 20px;
  margin-right: 15px;
`;
const RecordImg = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 15px;
`;
const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
const AddComment = styled.div`
  display: flex;
  flex-direction: column;
`;
const AddCommentTextArea = styled.textarea`
  resize: vertical;
  width: 100%;
`;
const AddCommentBtn = styled.div`
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
  &:hover {
    background-color: #000;
    color: #fff;
  }
`;
const CommentCount = styled.div`
  margin-top: 10px;
`;

const CommentCard = styled.div`
  position: relative;
`;
const CommentUserContainer = styled.div`
  display: flex;
`;
const CommentUserImg = styled.img`
  width: 40px;
  height: 40px;
`;
const CommentUserName = styled.div``;
const CommentTime = styled.div`
  position: absolute;
  right: 5px;
  top: 5px;
`;
const CommentContext = styled.div``;

export type CommentType = {
  user: {
    name: string;
    img: string;
  };
  useruid: string;
  context: string;
  commentTime: number;
};

const ArticleDetail = () => {
  const profile = useSelector<{ profile: Profile }>(
    (state) => state.profile
  ) as Profile;
  const { id } = useParams();
  const navigate = useNavigate();
  const [targetArticle, setTargetArticle] = useState<AllPetArticlesType>();
  const [articleComments, setArticleComments] = useState<CommentType[]>([]);
  const [newCommentContext, setNewCommentContext] = useState<string>();

  async function addArticleComment() {
    if (!targetArticle) return;
    if (!newCommentContext) {
      window.alert("留言內容不能為空白！");
      return;
    }
    await addDoc(collection(db, `petArticles/${targetArticle.id}/comments`), {
      user: {
        name: profile.name,
        img: profile.img,
      },
      useruid: profile.uid,
      context: newCommentContext,
      commentTime: Date.now(),
    });
    const articlesRef = doc(db, "petArticles", targetArticle.id);
    await updateDoc(articlesRef, {
      commentCount: targetArticle.commentCount + 1,
    });
    setNewCommentContext("");
    window.alert("留言成功");
    getArticleComments();
    getSpecificArticle();
  }

  async function getArticleComments() {
    if (!targetArticle) return;
    const articleComments: CommentType[] = [];
    const articlesRef = collection(
      db,
      `petArticles/${targetArticle.id}/comments`
    );
    let articlesSnapshot = await getDocs(
      query(articlesRef, orderBy("commentTime"))
    );
    articlesSnapshot.forEach((info) => {
      articleComments.push(info.data() as CommentType);
    });

    setArticleComments(articleComments);
  }

  async function getSpecificArticle() {
    const docRef = doc(db, "petArticles", id as string);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setTargetArticle({
        id: docSnap.id,
        ...docSnap.data(),
      } as AllPetArticlesType);
    } else {
      console.log("No such document!");
    }
  }

  async function toggleLike() {
    if (!targetArticle) return;
    if (!profile.isLogged) {
      window.alert("按讚需先登入，確認後導向登入頁面");
      navigate("/profile");
    }
    const articleDetailRef = doc(db, "petArticles", id as string);
    if (targetArticle.likedBy.includes(profile.uid)) {
      await updateDoc(articleDetailRef, {
        likedBy: arrayRemove(profile.uid),
      });
      const index = targetArticle.likedBy.indexOf(profile.uid);
      if (index > -1) {
        targetArticle.likedBy.splice(index, 1);
        setTargetArticle({
          ...targetArticle,
          likedBy: targetArticle.likedBy,
        });
      }
    } else {
      await updateDoc(articleDetailRef, {
        likedBy: arrayUnion(profile.uid),
      });
      targetArticle.likedBy.push(profile.uid);
      setTargetArticle({
        ...targetArticle,
        likedBy: targetArticle.likedBy,
      });
    }
  }

  useEffect(() => {
    getSpecificArticle();
  }, []);
  useEffect(() => {
    getArticleComments();
  }, [targetArticle]);

  if (!targetArticle) return null;
  return (
    <ArticleContainer>
      <ArticleCover src={targetArticle.img} />
      <TitleContainer>
        <Title>{targetArticle.title}</Title>
        <Author to={`/profile/${targetArticle.authorUid}`}>
          作者: {targetArticle.author.name}
        </Author>
        <ArticleDate>
          {new Date(targetArticle.postTime).getFullYear()}/
          {new Date(targetArticle.postTime).getMonth() + 1}/
          {new Date(targetArticle.postTime).getDate()}
        </ArticleDate>
      </TitleContainer>
      <ArticleContext className="DetailProseMirror">
        {parse(targetArticle.context)}
      </ArticleContext>
      <RecordContainer>
        <Record>喜歡 {targetArticle.likedBy.length}</Record>
        <Record>留言 {targetArticle.commentCount}</Record>
        {targetArticle.likedBy.includes(profile.uid) ? (
          <RecordImg
            src={alreadyLike}
            onClick={() => {
              toggleLike();
            }}
          />
        ) : (
          <RecordImg
            src={notyetLike}
            onClick={() => {
              toggleLike();
            }}
          />
        )}
      </RecordContainer>
      <CommentContainer>
        <AddComment>
          <AddCommentTextArea
            value={newCommentContext}
            placeholder="新增留言 ..."
            onChange={(e) => {
              setNewCommentContext(e.target.value);
            }}
          />
          <AddCommentBtn
            onClick={() => {
              if (!profile.isLogged) {
                window.alert("留言需先登入，確認後導向登入頁面");
                navigate("/profile");
              }
              addArticleComment();
            }}
          >
            新增留言
          </AddCommentBtn>
        </AddComment>
        <CommentCount>共 {targetArticle.commentCount} 則留言</CommentCount>
        {articleComments.map((comment, index) => (
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
    </ArticleContainer>
  );
};

export default ArticleDetail;