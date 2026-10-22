# 🍽️ 오늘 뭐 먹지?

냉장고 속 식재료를 관리하고, 보유한 재료로 만들 수 있는 레시피를 찾아보는 웹 서비스입니다.

강남대학교 소프트웨어전공 졸업작품으로 기획부터 설계·개발까지 진행했습니다.

## 📌 프로젝트 정보

- **개발 기간:** 2025.03 ~ 2025.12
- **개발 형태:** 개인 프로젝트
- **담당 역할:** 기획 · 설계 · 프론트엔드 · 백엔드
- **결과:** 졸업작품 최종 심사 통과

## 💡 개발 배경

1~2인 가구가 식재료를 관리하고 매일 먹을 메뉴를 선택하는 데 도움을 주고자 개발했습니다.

보유 재료와 유통기한을 확인하는 냉장고 관리 기능에 레시피 추천과 커뮤니티를 연결해, 식재료 관리부터 요리 정보 탐색까지 한곳에서 할 수 있도록 구성했습니다.

## ✨ 주요 기능

### 🔐 회원 관리
- 회원가입 및 로그인·로그아웃
- Spring Security·JWT 기반 인증
- 아이디·이메일·닉네임 중복 검사

### 🧊 냉장고 관리
- 식재료 등록·조회·수정·삭제
- 재료별 수량·구매일·유통기한 관리
- 재료 사용에 따른 수량 변경
- 캘린더 기반 식재료 확인

### 🥗 레시피
- 보유 재료 기반 레시피 추천
- 레시피 검색 및 정렬
- 재료와 조리 과정 등 상세 정보 조회
- 나만의 레시피 작성 및 승인 절차

### 💬 커뮤니티
- 4개 게시판을 통한 정보 공유
- 게시글 작성·조회·수정·삭제
- 댓글 및 좋아요

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| Language | Java 17, JavaScript |
| Frontend | React, Vite |
| Backend | Spring Boot, Spring Data JPA |
| Security | Spring Security, JWT |
| Database | MySQL |
| Deployment | Railway |
| Development Tools | IntelliJ IDEA, VS Code, Git, GitHub |

## 🔍 트러블슈팅

### 식재료 수량 변경 후 화면 미반영

**문제**

재료를 사용해 수량을 0으로 만든 뒤 수정 모달에서 1로 변경하면,
새로고침 전까지 화면에 변경된 값이 반영되지 않는 문제가 발생했습니다.

**분석**

새로고침 후 변경 내용이 표시되는 현상을 바탕으로,
서버 데이터와 React 로컬 상태가 동기화되는 흐름을 점검했습니다.
모달에서 수정한 데이터가 목록 상태에도 반영되는지와
수량의 문자열·숫자 타입 혼용 여부를 함께 살펴봤습니다.

**개선 방향**

- 저장·수정·삭제 성공 후 `fetchIngredients()`로 최신 목록 재조회
- 수량을 숫자 타입으로 통일
- 중복된 조회 로직을 정리해 상태 갱신 흐름 명확화

**배운 점**

API 요청의 성공 여부뿐 아니라 변경된 데이터가
사용자 화면에 반영되는 과정까지 확인해야 한다는 점을 배웠습니다.

## 🌱 프로젝트를 통해 배운 점

- 프론트엔드와 백엔드를 연결하는 웹 서비스 개발 경험
- JPA를 활용한 데이터 저장·조회 및 연관 데이터 관리
- JWT 기반 인증 처리
- 서버 데이터와 화면 상태의 일관성에 대한 이해
- 기획부터 구현까지 서비스 전체 흐름을 설계하는 경험

## 📂 프로젝트 자료

<img width="1251" height="705" alt="image" src="https://github.com/user-attachments/assets/f51092fd-5e93-43d8-9afd-bafb3da0f053" />
<img width="1254" height="700" alt="image" src="https://github.com/user-attachments/assets/f58a9b68-1aa3-4dd5-97b5-327716d97cba" />
<img width="1253" height="701" alt="image" src="https://github.com/user-attachments/assets/84231d30-e414-46a7-b2d6-cd24f39f41dc" />
<img width="1246" height="700" alt="image" src="https://github.com/user-attachments/assets/38270ae1-a964-4d3e-ada7-a284c0fa06a4" />
<img width="1256" height="707" alt="image" src="https://github.com/user-attachments/assets/40a28c7b-4406-44e1-9b7e-2ae63a1eff6d" />
<img width="1247" height="698" alt="image" src="https://github.com/user-attachments/assets/16a5ac10-c68e-49c1-b5c5-f3fc82c24c47" />
<img width="1250" height="705" alt="image" src="https://github.com/user-attachments/assets/9cd9f6f5-ccf4-46ef-9252-de9eddd073d9" />
<img width="1248" height="703" alt="image" src="https://github.com/user-attachments/assets/aba3b995-f41e-4111-80ed-29ea1516a14c" />
<img width="1251" height="701" alt="image" src="https://github.com/user-attachments/assets/c408f103-5fda-4333-a4f5-e39c3c473bb9" />

