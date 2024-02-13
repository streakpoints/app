import React, { ReactNode, useEffect } from 'react';
import styled from 'styled-components';

export const Modal = ({
  children,
  presented,
  preventCloseOnClick,
  loading,
  onClose,
  allowOverflow,
  modalWidth,
  ...props
}) => {
  const closeHandler = () => {
    if (!loading) onClose();
  };

  const escapeHandler = (e: any) => {
    if (e.key === 'Escape' && presented) {
      closeHandler();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', escapeHandler);
    document.body.style.overflow = presented ? 'hidden' : 'unset';

    return () => {
      document.removeEventListener('keydown', escapeHandler);
    };
  }, [escapeHandler, presented]);

  return (
    <SModalWrapper hidden={!presented} {...props}>
      <SModalBackground
        onClick={!preventCloseOnClick && closeHandler ? closeHandler : undefined}
      />
      <SModalContainer modalWidth={modalWidth}>
        <SModalBody allowOverflow={allowOverflow}>
          {children}
        </SModalBody>
      </SModalContainer>
    </SModalWrapper>
  );
};

export const SModalWrapper = styled.div`
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
`;

export const SModalBackground = styled(SModalWrapper)`
  background-color: gray;
  opacity: 80%;
`;

const breakpoint = '800px';

export const SModalContainer = styled.div`
  position: absolute;
  z-index: 1100;
  top: 128px;
  left: 50%;
  transform: translateX(-50%);
  background-color: black;
  border-radius: 0px;
  box-shadow: 0 12px 56px rgb(119 118 122 / 25%);
  padding: 1em;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 160px);
  @media (max-width: ${breakpoint}) {
    width: 100%;
    box-sizing: border-box;
    top: auto;
    bottom: 0;
    border-top: 1px solid #fff;
    border-bottom-left-radius: unset;
    border-bottom-right-radius: unset;
  }
  @media (min-width: ${breakpoint}) {
    border: 1px solid #fff;
    width: ${({ modalWidth }) => modalWidth};
  }
  @media (max-height: 500px) {
    top: 32px;
    max-height: calc(100% - 64px);
  }
`;

export const SModalBody = styled.div`
  height: 100%;
  overflow-y: ${({ allowOverflow }) => allowOverflow ? 'visible' : 'auto'};
`;
