import React from "react";

function Card(props) {
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <img 
          src={props.poster} 
          alt="Movie Poster" 
          style={styles.poster}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150x200/666666/ffffff?text=No+Image";
          }}
        />

        <h2 style={styles.title} className="content-title">{props.title}</h2>

        <hr style={styles.line} />

        <div style={styles.infoSection}>
          <div style={styles.infoRow}>
            <span style={styles.label} className="form-label">IMDB Rating:</span>
            <div style={styles.rating}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gold" viewBox="0 0 16 16">
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
              </svg>
              <span style={{ marginLeft: "6px" }}>{ratings}</span>
            </div>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.label} className="form-label">Release Year:</span>
            <span style={styles.detail} className="content-body">{props.year}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.label} className="form-label">Genres:</span>
            <div style={styles.genreList}>
              {props.genres.map((genre, idx) => (
                <span key={idx} style={styles.genre} className="accent-text">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr style={styles.line} />

        <div style={styles.actions}>
          <button className="card-button btn-secondary" style={styles.button}>⏰ Watch Later</button>
          <button className="card-button btn-secondary" style={styles.button}>❤️ Liked</button>
          <button className="card-button btn-secondary" style={styles.button}>🔁 Rewatch</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "350px",
    minHeight: "530px",
    backgroundColor: "#232b3b",
    borderRadius: "14px",
    padding: "25px 20px 35px",
    boxShadow: "0 8px 25px var(--color-card-shadow)",
    fontFamily: "'Poppins', sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#f5f6fa",
  },
  contentWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  poster: {
    width: "150px",
    height: "200px",
    objectFit: "cover",
    marginBottom: "12px",
    borderRadius: "8px",
  },
  title: {
    fontSize: "26px",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: "bold",
    fontStyle: "italic",
    margin: "5px 0 15px",
    letterSpacing: "1px",
    color: "#f5f6fa",
    height: "60px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  },
  line: {
    width: "90%",
    border: "none",
    borderTop: "1px solid #333a4d",
    margin: "10px 0",
  },
  infoSection: {
    width: "90%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  },
  label: {
    fontWeight: "530",
    marginRight: "10px",
    width: "120px",
    color: "#f5f6fa",
  },
  detail: {
    fontSize: "16px",
    color: "#f5f6fa",
  },
  rating: {
    display: "flex",
    alignItems: "center",
    fontSize: "16px",
    color: "#f5f6fa",
  },
  genreList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    paddingTop: "5px",
  },
  genre: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "18px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'Poppins', sans-serif",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "15px",
    justifyContent: "center"
  },
  button: {
    padding: "6px 12px",
    fontSize: "14px",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#ffd93d",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Card;
