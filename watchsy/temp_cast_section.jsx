                            {cast.cast.map((person, index) => {
                              const handlePersonClick = () => {
                                navigate(`/person/${person.id}`);
                              };
                              return (
                                <div key={person.id} onClick={handlePersonClick} style={{
                                  flexShrink: 0,
                                  width: "80px",
                                  textAlign: "center",
                                  animation: `fadeInUp 0.3s ease ${index * 0.1}s both`,
                                  cursor: "pointer",
                                  transition: "transform 0.2s ease"
                                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                                  <img
                                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                    alt={person.name}
                                    style={{
                                      width: "60px",
                                      height: "60px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      marginBottom: "6px",
                                      border: "2px solid rgba(255, 217, 61, 0.3)"
                                    }}
                                  />
                                  <div style={{
                                    fontSize: "0.75rem",
                                    color: "#ffd93d",
                                    fontWeight: "600",
                                    fontFamily: "'Inter', sans-serif"
                                  }}>
                                    {person.name}
                                  </div>
                                  <div style={{
                                    fontSize: "0.7rem",
                                    color: "#b8c5d6",
                                    fontFamily: "'Inter', sans-serif"
                                  }}>
                                    {person.character}
                                  </div>
                                </div>
                              );
                            })}
