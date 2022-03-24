import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';

import {
  useHistory,
  Link
} from 'react-router-dom';
import * as data from './data';

import SearchBarWrapper from './SearchBarWrapper';

function PageHeader(props) {
  const [userName, setUserName] = useState('');
  const history = useHistory();

  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5em' }}>
      <div style={{ textAlign: 'right', padding: '.5em', paddingLeft: '0' }}>
        <Link style={{ textDecoration: 'none' }} to='/'>🎙</Link>
      </div>
      {
        props.handle.length > 0 ? (
        <a
          target='_blank'
          rel='noreferrer'
          href={`https://twitter.com/${props.handle}`}
          style={{ textDecoration: 'none' }}
        >
          @{props.handle} ➫
        </a>
        ) : (
          <div style={{ width: '100%' }}>
            <SearchBarWrapper>
              <AsyncSelect
                cacheOptions={false}
                placeholder=''
                className='search-bar'
                classNamePrefix='search-bar'
                defaultOptions={[]}
                loadOptions={async (inputValue) => {
                  const results = await data.searchUser({
                    twitterAccountQuery: inputValue.replace('@', '')
                  });
                  return results.map(r => ({
                    label: `@${r.handle}`,
                    value: r.handle
                  }));
                }}
                components={{
                  ClearIndicator: () => null,
                  IndicatorSeparator: () => null,
                  DropdownIndicator: () => null,
                  MenuList: props => (<div className='search-bar__menu-list'>{props.children}</div>)
                }}
                value={userName}
                inputValue={userName}
                onInputChange={(newValue, meta) => {
                  if (meta.action === 'input-change') {
                    setUserName(newValue);
                  }
                }}
                onChange={async (newValue, meta) => {
                  if (meta.action === 'select-option') {
                    setUserName('');
                    history.push(`/${newValue.value}`);
                  }
                }}
              />
            </SearchBarWrapper>
          </div>
        )
      }

    </div>
  );
}

export default PageHeader;
