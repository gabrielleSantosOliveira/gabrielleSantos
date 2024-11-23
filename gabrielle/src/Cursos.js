import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente para um curso individual
const CursoComponent = ({ curso, usuarioLogado }) => {
    const [inscrito, setInscrito] = useState(false);

    useEffect(() => {
        // Verificar se o usuário já está inscrito nesse curso
        const verificarInscricao = async () => {
            try {
                const response = await axios.get(`/api/inscricoes/${usuarioLogado.id}`);
                const cursosInscritos = response.data;
                const isInscrito = cursosInscritos.some(inscricao => inscricao.id_curso === curso.id_curso);
                setInscrito(isInscrito);
            } catch (error) {
                console.error('Erro ao verificar inscrição:', error);
            }
        };

        verificarInscricao();
    }, [usuarioLogado.id, curso.id_curso]);

    const handleClickInscricao = async () => {
        try {
            const response = await axios.post('/api/inscricao', {
                id: usuarioLogado.id,            // Agora 'id' é o identificador do usuário
                id_curso: curso.id_curso
            });

            if (response.data.sucesso) {
                setInscrito(!inscrito); // Alterna o estado de inscrição
            } else {
                console.log('Erro ao gerenciar inscrição');
            }
        } catch (error) {
            console.error('Erro ao gerenciar inscrição:', error);
        }
    };

    return (
        <div className="curso">
            <h2>{curso.nome_curso}</h2>
            <img src={curso.foto} alt={curso.nome_curso} />
            <button onClick={handleClickInscricao}>
                <img
                    src={inscrito ? '/path/to/flecha_cheia.svg' : '/path/to/flecha_vazia.svg'}
                    alt="Inscrição"
                />
            </button>
        </div>
    );
};

// Componente principal para listar cursos
function Cursos({ abrirModal, usuarioLogado,  atualizarInscricoes}) {
    const [cursos, setCursos] = useState([]);
    const [comentario, setComentario] = useState('');
    const [comentariosCurso, setComentariosCurso] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [comentarioEditado, setComentarioEditado] = useState(null);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [inscricoes, setInscricoes] = useState({}); // Rastreia as inscrições do usuário por curso
    const [inscricaoLateral, setInscricaoLateral] = useState(0);
    const [numeroInscricoes, setNumeroInscricoes] = useState(0);


    useEffect(() => {
        axios.get('http://localhost:3001/api/cursos')
            .then(response => {
                setCursos(response.data);
            })
            .catch(error => {
                console.error("Erro ao buscar cursos:", error);
            });
    }, []);

    useEffect(() => {
        if (usuarioLogado) {
            axios.get(`http://localhost:3001/api/inscricoes/${usuarioLogado.id}`)
                .then((response) => {
                    const inscricoesUsuario = response.data.reduce((acc, inscricao) => {
                        acc[inscricao.id_curso] = true;
                        return acc;
                    }, {});
                    setInscricoes(inscricoesUsuario);
                })
                .catch((error) => {
                    console.error('Erro ao buscar inscrições:', error);
                });
        }
    }, [usuarioLogado]);

    // No seu componente Cursos ou onde o estado de inscrição do usuário é manipulado

    useEffect(() => {
        if (usuarioLogado) {
            // Fazer uma requisição para buscar as inscrições do usuário
            axios.get(`http://localhost:3001/api/inscricoes/${usuarioLogado.id}`)
                .then((response) => {
                    const inscricoesUsuario = response.data.reduce((acc, inscricao) => {
                        acc[inscricao.id_curso] = true;
                        return acc;
                    }, {});
                    setInscricoes(inscricoesUsuario);

                    // Atualizar a contagem de inscrições para cada curso
                    const countInscricoes = response.data.reduce((acc, inscricao) => {
                        acc[inscricao.id_curso] = (acc[inscricao.id_curso] || 0) + 1;
                        return acc;
                    }, {});
                    setInscricaoCount(countInscricoes);
                })
                .catch((error) => {
                    console.error('Erro ao buscar inscrições:', error);
                });
        }
    }, [usuarioLogado]);


    const handleIconClick = (cursoId) => {
        if (!usuarioLogado) {
            abrirModal();
        } else {
            setComentariosCurso((prevState) => ({
                ...prevState,
                [cursoId]: true,
            }));

            axios.get(`http://localhost:3001/api/comentarios/${cursoId}`)
                .then(response => {
                    setComentarios((prevState) => ({
                        ...prevState,
                        [cursoId]: response.data,
                    }));
                })
                .catch(error => {
                    console.error("Erro ao buscar comentários:", error);
                });
        }
    };

    const handleComentarioChange = (e) => {
        setComentario(e.target.value);
    };

    const handleEnviarComentario = (cursoId) => {
        if (comentario.trim() && usuarioLogado) {
            axios.post('http://localhost:3001/api/comentarios', {
                id_curso: cursoId,
                id: usuarioLogado.id,  // Atualizado para usar 'id' ao invés de 'id_usuario'
                mensagem: comentario,
            })
                .then(response => {
                    alert('Comentário enviado!');
                    setComentario('');
                    setComentariosCurso((prevState) => ({
                        ...prevState,
                        [cursoId]: false,
                    }));

                    axios.get(`http://localhost:3001/api/comentarios/${cursoId}`)
                        .then(response => {
                            setComentarios((prevState) => ({
                                ...prevState,
                                [cursoId]: response.data,
                            }));
                        })
                        .catch(error => {
                            console.error("Erro ao buscar comentários:", error);
                        });
                })
                .catch(error => {
                    console.error("Erro ao enviar comentário:", error);
                });
        } else if (!usuarioLogado) {
            abrirModal();
        } else {
            alert('O comentário não pode estar vazio!');
        }
    };

    const handleEditarComentario = (comentario) => {
        setComentarioEditado(comentario);
        setNovaMensagem(comentario.mensagem);
    };

    const handleAtualizarComentario = (cursoId, idComentario) => {
        if (novaMensagem.trim()) {
            axios.put(`http://localhost:3001/api/comentarios/${idComentario}`, {
                mensagem: novaMensagem,
                id_usuario: usuarioLogado.id,  // Atualizado para usar 'id' ao invés de 'id_usuario'
            })
                .then(response => {
                    alert('Comentário atualizado!');
                    setComentarios((prevState) => ({
                        ...prevState,
                        [cursoId]: prevState[cursoId].map((comentario) =>
                            comentario.id_comentario === idComentario
                                ? { ...comentario, mensagem: novaMensagem }
                                : comentario
                        ),
                    }));
                    setComentarioEditado(null);
                })
                .catch(error => {
                    console.error("Erro ao atualizar comentário:", error);
                });
        }
    };

    const handleDeletarComentario = (cursoId, idComentario) => {
        axios.delete(`http://localhost:3001/api/comentarios/${idComentario}`)
            .then(response => {
                alert('Comentário deletado!');
                setComentarios((prevState) => ({
                    ...prevState,
                    [cursoId]: prevState[cursoId].filter(comentario => comentario.id_comentario !== idComentario),
                }));
            })
            .catch(error => {
                console.error("Erro ao deletar comentário:", error);
            });
    };

    const [inscricaoCount, setInscricaoCount] = useState(0);
    const [inscrito, setInscrito] = useState(false);

    useEffect(() => {
        // Buscar a contagem total de inscrições para cada curso
        axios.get('http://localhost:3001/api/inscricoes/count')
            .then(response => {
                // Espera-se que a resposta tenha a estrutura { id_curso: total_inscricoes }
                const count = response.data.reduce((acc, { id_curso, total_inscricoes }) => {
                    acc[id_curso] = total_inscricoes;
                    return acc;
                }, {});
                setInscricaoCount(count); // Atualiza a contagem de inscrições
            })
            .catch(error => {
                console.error('Erro ao buscar contagem de inscrições:', error);
            });
    }, []);
    

    useEffect(() => {
        if (usuarioLogado) {
            axios.get(`http://localhost:3001/api/inscricoes/${usuarioLogado.id}`)
                .then((response) => {
                    const inscricoesUsuario = response.data.reduce((acc, inscricao) => {
                        acc[inscricao.id_curso] = true;
                        return acc;
                    }, {});
                    setInscricoes(inscricoesUsuario);
                })
                .catch((error) => {
                    console.error('Erro ao buscar inscrições:', error);
                });
        }
    }, [usuarioLogado]);

    const handleInscricao = async (cursoId) => {
        if (!usuarioLogado) {
            abrirModal(); // Caso o usuário não esteja logado, abre o modal de login
            return;
        }
    
        try {
            // Verificar se o usuário já está inscrito neste curso
            const inscricaoExistente = await axios.get(`http://localhost:3001/api/inscricoes/${usuarioLogado.id}`);
            const inscricaoNoCurso = inscricaoExistente.data.find(inscricao => inscricao.id_curso === cursoId);
    
            if (inscricaoNoCurso) {
                // Caso já esteja inscrito, remover a inscrição
                const response = await axios.delete(`http://localhost:3001/api/inscricao/${inscricaoNoCurso.id_inscricao}`);
    
                if (response.data.sucesso) {
                    setInscricoes((prevState) => ({
                        ...prevState,
                        [cursoId]: false, // Define como não inscrito
                    }));
                    setInscricaoCount((prevState) => ({
                        ...prevState,
                        [cursoId]: (prevState[cursoId] || 0) - 1, // Decrementa a contagem
                    }));
                    alert('Sua inscrição foi cancelada');
                } else {
                    alert('Erro ao cancelar inscrição');
                }
            } else {
                // Caso não esteja inscrito, criar a inscrição
                const response = await axios.post('http://localhost:3001/api/inscricao', {
                    id: usuarioLogado.id, // ID do usuário logado
                    id_curso: cursoId,    // ID do curso clicado
                });
    
                if (response.data.sucesso) {
                    setInscricoes((prevState) => ({
                        ...prevState,
                        [cursoId]: true, // Define como inscrito
                    }));
                    setInscricaoCount((prevState) => ({
                        ...prevState,
                        [cursoId]: (prevState[cursoId] || 0) + 1, // Incrementa a contagem
                    }));
                    alert('Inscrição realizada com sucesso!');
                } else {
                    alert(response.data.mensagem); // Mensagem de erro
                }
            }
        } catch (error) {
            console.error('Erro ao realizar inscrição:', error);
            alert('Erro ao realizar inscrição.');
        }
    };
    
    
    return (
        <div className="cursos">
            {cursos.map((curso) => {
                const inscrito = inscricoes[curso.id_curso] || false;
                const numComentarios = comentarios[curso.id_curso] ? comentarios[curso.id_curso].length : 0;
                const inscricoesCount = inscricaoCount[curso.id_curso] || 0;

                return (
                    <div className="curso" key={curso.id_curso}>
                        <div className="nomeInst">
                            <p>{curso.nome_curso}</p>
                            <p>{curso.instituicao}</p>
                        </div>
                        <div className="fotoCurso">
                            <img className="cursoImg" src={curso.foto} alt={curso.nome_curso} />
                        </div>
                        <div className="svgDiv">
                            <div className="comentarioDiv">
                                <img
                                    className="svg"
                                    src={inscrito ? "/flecha_cima_cheia.svg" : "/flecha_cima_vazia.svg"}
                                    alt="Inscrição"
                                    onClick={() => handleInscricao(curso.id_curso)}
                                />
                                <p>{inscricaoCount[curso.id_curso] || 0}</p>
                            </div>
                            <div className="comentarioDiv">
                                <img
                                    className="svg"
                                    src="chat.svg"
                                    alt="comentario"
                                    onClick={() => handleIconClick(curso.id_curso)}
                                />
                                <p>{numComentarios}</p>
                            </div>
                        </div>

                        {comentariosCurso[curso.id_curso] && (
                            <div className="comentarioBox">
                                <p>{usuarioLogado ? usuarioLogado.nome : 'Usuário não logado'}</p>
                                <textarea
                                    value={comentario}
                                    onChange={handleComentarioChange}
                                    placeholder="Escreva seu comentário..."
                                />
                                <button
                                    onClick={() => handleEnviarComentario(curso.id_curso)}
                                    disabled={!comentario.trim()}
                                >
                                    Comentar
                                </button>
                            </div>
                        )}

                        {comentarios[curso.id_curso] && comentarios[curso.id_curso].map((comentario) => (
                            <div key={comentario.id_comentario} className="comentario" style={{ border: '1px solid #cacaca' }}>
                                <p><strong>{comentario.usuario.nome} ({comentario.usuario.email})</strong></p>
                                <p>{comentario.mensagem}</p>
                                {comentario.id === usuarioLogado.id && (
                                    <>
                                        <img
                                            className="lapisEditar"
                                            src="lapis_editar.svg"
                                            alt="Editar"
                                            onClick={() => handleEditarComentario(comentario)}
                                        />
                                        <img
                                            className="lapisEditar"
                                            src="lixeira_deletar.svg"
                                            alt="Deletar"
                                            onClick={() => handleDeletarComentario(curso.id_curso, comentario.id_comentario)}
                                        />
                                    </>
                                )}

                                {comentarioEditado && comentarioEditado.id_comentario === comentario.id_comentario && (
                                    <div>
                                        <textarea
                                            value={novaMensagem}
                                            onChange={(e) => setNovaMensagem(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleAtualizarComentario(curso.id_curso, comentario.id_comentario)}
                                        >
                                            Atualizar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default Cursos;
