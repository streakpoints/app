import styled from 'styled-components';

const SearchBarWrapper = styled.div`
  & {
    cursor: pointer;
  }
  /* Bar itself */
  & .search-bar__control, & .search-bar__control--is-focused {
    border: 1px solid #ccc !important;
    border-radius: 12px;
    box-shadow: none;
    background-color: rgb(238, 238, 238);
    font-size: 16px;
  }
  & .search-bar__control {
    min-height: unset;
  }

  /* Selected Value */
  & .search-bar__control--is-focused .search-bar__multi-value {
    /* Hide the selected value when the text input has focus */
    opacity: 0;
  }
  & .search-bar__multi-value {
    background-color: transparent;
    padding: .15em 0;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    padding: .3em 0;
    /* text-align: center using CSS transforms 1/2*/
    transform: translateX(50%);
    transition: .3s;
    opacity: 1;
  }
  & .search-bar__multi-value__remove {
    display: none;
  }
  & .search-bar__multi-value__label {
    color: #000;
    padding: 0;

    /* text-align: center using CSS transforms 1/2*/
    display: inline-block;
    transform: translateX(-50%);
  }


  /* Dropdown */
  & .search-bar__menu {
    font-size: 16px;
    margin-bottom: 4em;
    background-color: #fafafa;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 5px #777;
    border: 0;
  }

  & .search-bar__menu-list {
    padding: 0;
  }
  & .search-bar__option {
    cursor: pointer;
    width: 100%;
  }
  & .search-bar__option--is-focused {
    background-color: #ddd;
  }

  & .search-bar__single-value {
    color: #000;
    text-align: left;
  }

  /* Full width search */
  & .search-bar__value-container > div {
    /* This targets the input wrapper which has no class name */
    width: 100%;
  }
  & .search-bar__input {
    display: block !important;
    padding-left: 2px;
    color: #000;
  }
  & .search-bar__input input {
    font-family: 'Cartograph';
    width: 100% !important;
    /*text-align: center;*/
    z-index: 1;
  }
`;

export default SearchBarWrapper;
