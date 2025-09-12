import React, { useState, useEffect } from "react";
import "./Card.css";
import star from "../../assets/star.png";
import { useUserData } from "../../hooks/useUserData";
import { emit, on } from "../../events/bus";
import { useToast } from "../ToastProvider";
import posterFiller from "../../assets/posterFiller.jpg";
import { voteOnMovie, getUserVote, getMovieVotes } from "../../services/votes-mock";
