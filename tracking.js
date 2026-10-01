/* CMA Zone / TaxPath — student exam analytics */
(function(){
"use strict";
const CFG={
 apiKey:"AIzaSyA7tGvsDYyYLSWFPeS6lsxlP8gLOw53Wrk",
 authDomain:"cma-mcq-portal.firebaseapp.com",
 projectId:"cma-mcq-portal",
 storageBucket:"cma-mcq-portal.firebasestorage.app",
 messagingSenderId:"734935438365",
 appId:"1:734935438365:web:40ea0a7677ef572234a2f4"
};
try{
 if(!window.firebase){console.warn("Firebase SDK not loaded; exam analytics disabled.");return;}
 if(!firebase.apps.length)firebase.initializeApp(CFG);
}catch(e){console.error("Firebase init failed",e);return;}
const db=firebase.firestore(),auth=firebase.auth();
let currentUser=null;
auth.onAuthStateChanged(u=>{currentUser=u||null;});
function pathParts(){
 const p=location.pathname.replace(/\/+$/,"").split("/").filter(Boolean);
 return p;
}
function inferGroup(){
 const p=location.pathname.toLowerCase();
 if(p.includes("/foundation/"))return "Foundation";
 if(p.includes("/inter-group-1/"))return "Intermediate Group 1";
 if(p.includes("/inter-group-2/"))return "Intermediate Group 2";
 if(p.includes("/final-group-3/"))return "Final Group 3";
 if(p.includes("/final-group-4/"))return "Final Group 4";
 if(p.includes("/scm/"))return "Final Group 3";
 if(p.includes("/sfm/"))return "Final Group 3";
 return "";
}
function clean(v){return v==null?"":String(v);}
function escObj(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return String(v);}}
function normalizeQuestions(qs){
 return (qs||[]).map((q,i)=>({
   number:i+1,
   questionId:q.questionId??q.id??q.sl??i+1,
   question:clean(q.question??q.q),
   selectedIndex:q.selectedIndex??q.choice??q.chosenIdx??null,
   selectedAnswer:clean(q.selectedAnswer??q.chosenText??""),
   correctIndex:q.correctIndex??q.correctIdx??q.answer??q.ans??null,
   correctAnswer:clean(q.correctAnswer??q.correctText??""),
   correct:!!q.correct,
   timedOut:!!q.timedOut,
   skipped:q.skipped===true || (q.selectedIndex??q.choice??q.chosenIdx)===null,
   topic:clean(q.topic??""),
   source:clean(q.source??""),
   attempt:clean(q.attempt??"")
 }));
}
window.CMAAnalytics={
 start:function(meta){
   window.__cmaExamStartAt=Date.now();
   window.__cmaExamMeta=escObj(meta||{});
 },
 record:async function(payload){
   try{
     if(!currentUser){
       currentUser=auth.currentUser;
     }
     if(!currentUser||!currentUser.uid){
       console.warn("Exam result not saved: student is not authenticated.");
       return null;
     }
     const started=window.__cmaExamStartAt||Date.now();
     const completed=Date.now();
     const qs=normalizeQuestions(payload.questions||[]);
     const ref=db.collection("examAttempts").doc();
     const data={
       attemptId:ref.id,
       uid:currentUser.uid,
       email:(currentUser.email||"").toLowerCase(),
       displayName:currentUser.displayName||"",
       examTitle:clean(payload.examTitle||document.title),
       subject:clean(payload.subject||""),
       group:clean(payload.group||inferGroup()),
       examPath:location.pathname,
       source:clean(payload.source||"MCQ Bank"),
       sourceAttempt:clean(payload.sourceAttempt||""),
       mode:clean(payload.mode||"practice"),
       questionCount:Number((payload.questionCount??qs.length) || 0),
       marksPerQuestion:Number(payload.marksPerQuestion??1),
       maxMarks:Number(payload.maxMarks??0),
       correct:Number(payload.correct??0),
       wrong:Number(payload.wrong??0),
       skipped:Number(payload.skipped??0),
       score:Number(payload.score??0),
       percentage:Number(payload.percentage??0),
       startedAt:firebase.firestore.Timestamp.fromMillis(started),
       completedAt:firebase.firestore.Timestamp.fromMillis(completed),
       durationSeconds:Math.max(0,Math.round((completed-started)/1000)),
       questions:qs,
       createdAt:firebase.firestore.FieldValue.serverTimestamp()
     };
     await ref.set(data);
     await db.collection("portalUsers").doc(currentUser.uid).set({
       uid:currentUser.uid,email:(currentUser.email||"").toLowerCase(),
       displayName:currentUser.displayName||"",
       lastExamAt:firebase.firestore.FieldValue.serverTimestamp(),
       lastExamTitle:data.examTitle,lastExamScore:data.score,
       lastExamPercentage:data.percentage,updatedAt:firebase.firestore.FieldValue.serverTimestamp()
     },{merge:true});
     window.__cmaExamStartAt=null;
     return ref.id;
   }catch(e){
     console.error("Exam analytics save failed",e);
     return null;
   }
 }
};
})();